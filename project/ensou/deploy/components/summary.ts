import { and, between, desc, eq } from "drizzle-orm";
import { ResultAsync } from "neverthrow";
import type {
  ProjectUsagePerTime,
  UserUsagePerTime,
} from "../../../domain/entities/summary.js";
import { adapterInternalError } from "../../../domain/errors/appError.js";
import type { ISummaryRepository } from "../../../usecase/ports/ISummaryRepository.js";
import type { DB } from "../index.js";
import {
  LLMUsageTable,
  MessageTable,
  ProjectTable,
  ThreadTable,
  UserTable,
} from "../schema.js";
import {
  coalesceToNumber,
  countAsNumber,
  countDistinctAsNumber,
  orderByNumber,
  sumAsNumber,
  toCharDay,
} from "../utils/sqlHelpers.js";

export const useSummaryRepository = (client: DB): ISummaryRepository => {
  return {
    getUserUsageByDayInMonth: (params) => {
      return ResultAsync.fromPromise(
        (async () => {
          // WHY: toCharDayヘルパーを使ってSQLレベルで日別集計を行う
          // sqlHelpers.tsに定義した共通ヘルパーで一貫性を保つ
          const dateColumn = toCharDay(MessageTable.createdAt);
          const rows = await client
            .select({
              date: dateColumn,
              messageCount: countAsNumber(MessageTable.id).as("messageCount"),
              tokenCount: sumAsNumber(LLMUsageTable.totalToken).as(
                "tokenCount",
              ),
              threadCount: countDistinctAsNumber(ThreadTable.id).as(
                "threadCount",
              ),
            })
            .from(MessageTable)
            .innerJoin(ThreadTable, eq(MessageTable.threadId, ThreadTable.id))
            .leftJoin(
              LLMUsageTable,
              eq(LLMUsageTable.messageID, MessageTable.id),
            )
            .where(
              and(
                eq(ThreadTable.userID, params.userID),
                eq(LLMUsageTable.organizationID, params.organizationID),
                between(MessageTable.createdAt, params.startAt, params.endAt),
              ),
            )
            .groupBy(dateColumn)
            .orderBy(dateColumn);

          // WHY: 文字列の日付をDateオブジェクトに変換して返す
          // APIレスポンスの一貫性を保つため
          return rows.map((row) => ({
            date: new Date(row.date),
            messageCount: row.messageCount,
            tokenCount: row.tokenCount,
            threadCount: row.threadCount,
          }));
        })(),
        (error) => adapterInternalError({ message: String(error) }),
      );
    },
    getOrganizationUserUsageThisMonthListPerTime: (params) => {
      return ResultAsync.fromPromise(
        (async () => {
          // 集計の対象期間を決定
          // 未指定時は最古から最新までの全期間
          const start = params.startAt ?? new Date(0);
          const end = params.endAt ?? new Date();

          // WHY: サブクエリで各指標を事前集計し、最後にLEFT JOINで結合
          // これによりユーザーごとの3つの指標を効率的に取得

          // メッセージ数の集計用サブクエリ
          const msgAgg = client
            .select({
              userID: ThreadTable.userID,
              messageCount: countAsNumber(MessageTable.id).as("messageCount"),
            })
            .from(MessageTable)
            .innerJoin(ThreadTable, eq(MessageTable.threadId, ThreadTable.id))
            .innerJoin(UserTable, eq(ThreadTable.userID, UserTable.id))
            .where(
              and(
                eq(UserTable.organizationID, params.organizationID),
                between(MessageTable.createdAt, start, end),
              ),
            )
            .groupBy(ThreadTable.userID)
            .as("msgAgg");

          // スレッド数の集計用サブクエリ
          const thAgg = client
            .select({
              userID: ThreadTable.userID,
              threadCount: countAsNumber(ThreadTable.id).as("threadCount"),
            })
            .from(ThreadTable)
            .innerJoin(UserTable, eq(ThreadTable.userID, UserTable.id))
            .where(
              and(
                eq(UserTable.organizationID, params.organizationID),
                between(ThreadTable.createdAt, start, end),
              ),
            )
            .groupBy(ThreadTable.userID)
            .as("thAgg");

          // トークン数の集計用サブクエリ
          const tokAgg = client
            .select({
              userID: LLMUsageTable.userID,
              tokenCount: sumAsNumber(LLMUsageTable.totalToken).as(
                "tokenCount",
              ),
            })
            .from(LLMUsageTable)
            .where(
              and(
                eq(LLMUsageTable.organizationID, params.organizationID),
                between(LLMUsageTable.createdAt, start, end),
              ),
            )
            .groupBy(LLMUsageTable.userID)
            .as("tokAgg");

          // メインクエリ: 全ユーザーに対してサブクエリの結果をLEFT JOIN
          const base = client
            .select({
              userID: UserTable.id,
              userName: UserTable.name,
              email: UserTable.email,
              messageCount: coalesceToNumber(msgAgg.messageCount),
              threadCount: coalesceToNumber(thAgg.threadCount),
              tokenCount: coalesceToNumber(tokAgg.tokenCount),
            })
            .from(UserTable)
            .leftJoin(msgAgg, eq(UserTable.id, msgAgg.userID))
            .leftJoin(thAgg, eq(UserTable.id, thAgg.userID))
            .leftJoin(tokAgg, eq(UserTable.id, tokAgg.userID))
            .where(eq(UserTable.organizationID, params.organizationID));

          // WHY: 動的なソート条件を構築
          // 各orderByパラメータに応じて適切なSQL式を生成
          const orderBy = params.orderBy ?? "name";
          const order =
            (params.order ?? "asc").toLowerCase() === "desc" ? "desc" : "asc";

          // WHY: 複雑な条件分岐だが、各ソート条件を明示的に定義することで
          // SQL実行時の型安全性を保証
          const orderExpr =
            orderBy === "message"
              ? order === "desc"
                ? desc(orderByNumber(msgAgg.messageCount))
                : orderByNumber(msgAgg.messageCount)
              : orderBy === "thread"
                ? order === "desc"
                  ? desc(orderByNumber(thAgg.threadCount))
                  : orderByNumber(thAgg.threadCount)
                : orderBy === "token"
                  ? order === "desc"
                    ? desc(orderByNumber(tokAgg.tokenCount))
                    : orderByNumber(tokAgg.tokenCount)
                  : orderBy === "email"
                    ? order === "desc"
                      ? desc(UserTable.email)
                      : UserTable.email
                    : order === "desc"
                      ? desc(UserTable.name)
                      : UserTable.name;

          const rows = await base
            .orderBy(orderExpr)
            // WHY: limit未指定時のデフォルトを1000に設定（過負荷防止）
            // TODO: 全件取れない場合は、ユーザ側にstart, endの範囲を狭めてもらうように誘導する
            .limit(params.limit ?? 1000);

          return {
            organizationID: params.organizationID,
            users: rows.map<UserUsagePerTime>((r) => ({
              userID: r.userID,
              userName: r.userName,
              email: r.email,
              usage: {
                messageCount: r.messageCount,
                tokenCount: r.tokenCount,
                threadCount: r.threadCount,
                usageTime: end,
              },
              perTimeUnit: params.perTimeUnit,
              from: start,
              to: end,
            })),
            perTimeUnit: params.perTimeUnit,
            from: start,
            to: end,
          };
        })(),
        (error) => adapterInternalError({ message: String(error) }),
      );
    },

    getOrganizationProjectUsageThisMonthListPerTime: (params) => {
      return ResultAsync.fromPromise(
        (async () => {
          // 集計の対象期間を決定
          const start = params.startAt ?? new Date(0);
          const end = params.endAt ?? new Date();

          // メッセージ数の集計用サブクエリ
          const msgAgg = client
            .select({
              projectID: ThreadTable.projectID,
              messageCount: countAsNumber(MessageTable.id).as("messageCount"),
            })
            .from(MessageTable)
            .innerJoin(ThreadTable, eq(MessageTable.threadId, ThreadTable.id))
            .innerJoin(UserTable, eq(ThreadTable.userID, UserTable.id))
            .where(
              and(
                eq(UserTable.organizationID, params.organizationID),
                between(MessageTable.createdAt, start, end),
              ),
            )
            .groupBy(ThreadTable.projectID)
            .as("msgAgg");

          // スレッド数の集計用サブクエリ
          const thAgg = client
            .select({
              projectID: ThreadTable.projectID,
              threadCount: countAsNumber(ThreadTable.id).as("threadCount"),
            })
            .from(ThreadTable)
            .innerJoin(UserTable, eq(ThreadTable.userID, UserTable.id))
            .where(
              and(
                eq(UserTable.organizationID, params.organizationID),
                between(ThreadTable.createdAt, start, end),
              ),
            )
            .groupBy(ThreadTable.projectID)
            .as("thAgg");

          // ユニークユーザー数の集計用サブクエリ
          const userAgg = client
            .select({
              projectID: ThreadTable.projectID,
              userCount: countDistinctAsNumber(ThreadTable.userID).as(
                "userCount",
              ),
            })
            .from(ThreadTable)
            .innerJoin(UserTable, eq(ThreadTable.userID, UserTable.id))
            .where(
              and(
                eq(UserTable.organizationID, params.organizationID),
                between(ThreadTable.createdAt, start, end),
              ),
            )
            .groupBy(ThreadTable.projectID)
            .as("userAgg");

          // トークン数の集計用サブクエリ（プロジェクトIDで集計）
          // Threadテーブルを経由してprojectIDを取得
          const tokAgg = client
            .select({
              projectID: ThreadTable.projectID,
              tokenCount: sumAsNumber(LLMUsageTable.totalToken).as(
                "tokenCount",
              ),
            })
            .from(LLMUsageTable)
            .innerJoin(
              MessageTable,
              eq(LLMUsageTable.messageID, MessageTable.id),
            )
            .innerJoin(ThreadTable, eq(MessageTable.threadId, ThreadTable.id))
            .where(
              and(
                eq(LLMUsageTable.organizationID, params.organizationID),
                between(LLMUsageTable.createdAt, start, end),
              ),
            )
            .groupBy(ThreadTable.projectID)
            .as("tokAgg");

          // メインクエリ: 全プロジェクトに対してサブクエリの結果をLEFT JOIN
          const base = client
            .select({
              projectID: ProjectTable.projectID,
              projectName: ProjectTable.name,
              visibility: ProjectTable.visibility,
              messageCount: coalesceToNumber(msgAgg.messageCount),
              threadCount: coalesceToNumber(thAgg.threadCount),
              userCount: coalesceToNumber(userAgg.userCount),
              tokenCount: coalesceToNumber(tokAgg.tokenCount),
            })
            .from(ProjectTable)
            .leftJoin(msgAgg, eq(ProjectTable.projectID, msgAgg.projectID))
            .leftJoin(thAgg, eq(ProjectTable.projectID, thAgg.projectID))
            .leftJoin(userAgg, eq(ProjectTable.projectID, userAgg.projectID))
            .leftJoin(tokAgg, eq(ProjectTable.projectID, tokAgg.projectID))
            .where(
              and(
                eq(ProjectTable.organizationID, params.organizationID),
                eq(ProjectTable.isDeleted, false),
              ),
            );

          // 動的なソート条件を構築
          const orderBy = params.orderBy ?? "name";
          const order =
            (params.order ?? "asc").toLowerCase() === "desc" ? "desc" : "asc";

          const orderExpr =
            orderBy === "message"
              ? order === "desc"
                ? desc(orderByNumber(msgAgg.messageCount))
                : orderByNumber(msgAgg.messageCount)
              : orderBy === "thread"
                ? order === "desc"
                  ? desc(orderByNumber(thAgg.threadCount))
                  : orderByNumber(thAgg.threadCount)
                : orderBy === "token"
                  ? order === "desc"
                    ? desc(orderByNumber(tokAgg.tokenCount))
                    : orderByNumber(tokAgg.tokenCount)
                  : orderBy === "user"
                    ? order === "desc"
                      ? desc(orderByNumber(userAgg.userCount))
                      : orderByNumber(userAgg.userCount)
                    : order === "desc"
                      ? desc(ProjectTable.name)
                      : ProjectTable.name;

          const rows = await base
            .orderBy(orderExpr)
            .limit(params.limit ?? 1000);

          return {
            organizationID: params.organizationID,
            projects: rows.map<ProjectUsagePerTime>((r) => ({
              projectID: r.projectID,
              projectName: r.projectName,
              visibility: r.visibility,
              usage: {
                messageCount: r.messageCount,
                tokenCount: r.tokenCount,
                threadCount: r.threadCount,
                userCount: r.userCount,
                usageTime: end,
              },
              perTimeUnit: params.perTimeUnit,
              from: start,
              to: end,
            })),
            perTimeUnit: params.perTimeUnit,
            from: start,
            to: end,
          };
        })(),
        (error) => adapterInternalError({ message: String(error) }),
      );
    },
  };
};
