import { act, renderHook } from "@testing-library/react";

import { useDelete } from "@/hooks/usecases/delete";

export type TestModel = {
  id: string;
  name: string;
};

export const newTestModel = (): TestModel => ({
  id: "initTestModelId",
  name: "initTestModelName",
});

// カスタムフック内で用いる関数は全てモックする
const mockUseDeleteTestModel = jest.fn();
const mockSuccessCallBack = jest.fn();
const mockFailedCallBack = jest.fn();

describe("useDelete", () => {
  beforeEach(() => {
    mockUseDeleteTestModel.mockClear();
    mockSuccessCallBack.mockClear();
    mockFailedCallBack.mockClear();
  });
  describe("初期化", () => {
    test("初期値が代入されていて、関数は一度も呼ばれていない", async () => {
      const { result } = renderHook(() =>
        useDelete(
          mockUseDeleteTestModel,
          newTestModel,
          "id",
          newTestModel,
          mockSuccessCallBack,
          mockFailedCallBack,
        ),
      );
      expect(result.current.obj).toEqual({
        id: "initTestModelId",
        name: "initTestModelName",
      });
      expect(result.current.ret).toEqual({
        id: "initTestModelId",
        name: "initTestModelName",
      });
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.isDeleteModalOpen).toBe(false);
      expect(result.current.hasFailed).toBe(false);
      expect(mockUseDeleteTestModel).toHaveBeenCalledTimes(0);
      expect(mockSuccessCallBack).toHaveBeenCalledTimes(0);
      expect(mockFailedCallBack).toHaveBeenCalledTimes(0);
    });
  });
  describe("削除実行する", () => {
    test("削除Usecaseが機能して、成功コールバックが呼ばれる", async () => {
      // モックの実装
      const mockDeletedObj: TestModel = {
        id: "mockObjId",
        name: "mockObjName",
      };
      mockUseDeleteTestModel.mockImplementation(() =>
        Promise.resolve(mockDeletedObj),
      );

      // フックスをレンダリングする
      const { result } = renderHook(() =>
        useDelete(
          mockUseDeleteTestModel,
          newTestModel,
          "id",
          newTestModel,
          mockSuccessCallBack,
          mockFailedCallBack,
        ),
      );

      // 削除実行
      const { exec } = result.current;
      await act(() => exec());

      // 削除実行後の評価
      expect(result.current.obj).toEqual({
        id: "initTestModelId",
        name: "initTestModelName",
      });
      expect(result.current.ret).toEqual({
        id: "mockObjId",
        name: "mockObjName",
      });
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.isDeleteModalOpen).toBe(false);
      expect(result.current.hasFailed).toBe(false);
      expect(mockUseDeleteTestModel).toHaveBeenCalledTimes(1);
      expect(mockUseDeleteTestModel).toHaveBeenCalledWith("initTestModelId");
      expect(mockSuccessCallBack).toHaveBeenCalledTimes(1);
      expect(mockFailedCallBack).toHaveBeenCalledTimes(0);
    });
    test("削除Usecaseが失敗して、失敗コールバックが呼ばれる", async () => {
      // 失敗用のモックを実装
      mockUseDeleteTestModel.mockImplementation(() => {
        throw new Error("error");
      });

      // フックスをレンダリングする
      const { result } = renderHook(() =>
        useDelete(
          mockUseDeleteTestModel,
          newTestModel,
          "id",
          newTestModel,
          mockSuccessCallBack,
          mockFailedCallBack,
        ),
      );

      // 削除実行
      const { exec } = result.current;
      await act(() => exec());

      // 実行後の評価
      expect(result.current.obj).toEqual({
        id: "initTestModelId",
        name: "initTestModelName",
      });
      expect(result.current.ret).toEqual({
        id: "initTestModelId",
        name: "initTestModelName",
      });
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.isDeleteModalOpen).toBe(false);
      expect(result.current.hasFailed).toBe(true);
      expect(mockUseDeleteTestModel).toHaveBeenCalledTimes(1);
      expect(mockUseDeleteTestModel).toHaveBeenCalledWith("initTestModelId");
      expect(mockSuccessCallBack).toHaveBeenCalledTimes(0);
      expect(mockFailedCallBack).toHaveBeenCalledTimes(1);
    });
  });
  describe("削除モーダルを開く", () => {
    test("指定したモデルが代入され、モーダルが開く", async () => {
      // フックスをレンダリングする
      const { result } = renderHook(() =>
        useDelete(
          mockUseDeleteTestModel,
          newTestModel,
          "id",
          newTestModel,
          mockSuccessCallBack,
          mockFailedCallBack,
        ),
      );

      // 削除ボタン押下
      const { handleClickDeleteButton } = result.current;
      await act(() => {
        const target: TestModel = { id: "targetId", name: "targetName" };
        handleClickDeleteButton(target);
      });

      // 削除実行後の評価
      expect(result.current.obj).toEqual({
        id: "targetId",
        name: "targetName",
      });

      expect(result.current.ret).toEqual({
        id: "initTestModelId",
        name: "initTestModelName",
      });
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.isDeleteModalOpen).toBe(true); // モーダルが開いている
      expect(result.current.hasFailed).toBe(false);
      expect(mockUseDeleteTestModel).toHaveBeenCalledTimes(0);
      expect(mockSuccessCallBack).toHaveBeenCalledTimes(0);
      expect(mockFailedCallBack).toHaveBeenCalledTimes(0);
    });
  });
  describe("削除モーダルを閉じる", () => {
    test("モーダルが開いていない状態から閉じると、初期値から変化しない", async () => {
      // フックスをレンダリングする
      const { result } = renderHook(() =>
        useDelete(
          mockUseDeleteTestModel,
          newTestModel,
          "id",
          newTestModel,
          mockSuccessCallBack,
          mockFailedCallBack,
        ),
      );

      // 削除キャンセル
      const { handleClickCancelButton } = result.current;
      await act(() => {
        handleClickCancelButton();
      });

      // Assertion
      // 削除対象オブジェクトは初期値のまま
      expect(result.current.obj).toEqual({
        id: "initTestModelId",
        name: "initTestModelName",
      });

      expect(result.current.ret).toEqual({
        id: "initTestModelId",
        name: "initTestModelName",
      });
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.isDeleteModalOpen).toBe(false); // モーダルは開いていない
      expect(result.current.hasFailed).toBe(false);
      // 削除実行関数はいずれも発火しない
      expect(mockUseDeleteTestModel).toHaveBeenCalledTimes(0);
      expect(mockSuccessCallBack).toHaveBeenCalledTimes(0);
      expect(mockFailedCallBack).toHaveBeenCalledTimes(0);
    });
    test("モーダルを開いて閉じると、対象オブジェクトは初期化されモーダルは閉じる", async () => {
      // フックスをレンダリングする
      const { result } = renderHook(() =>
        useDelete(
          mockUseDeleteTestModel,
          newTestModel,
          "id",
          newTestModel,
          mockSuccessCallBack,
          mockFailedCallBack,
        ),
      );

      // 削除キャンセル
      const { handleClickDeleteButton, handleClickCancelButton } =
        result.current;
      await act(() => {
        // 一度モーダルを開けて閉じる
        const target: TestModel = { id: "targetId", name: "targetName" };
        handleClickDeleteButton(target);
        handleClickCancelButton();
      });

      // Assertion
      // 削除対象オブジェクトは初期値のまま
      expect(result.current.obj).toEqual({
        id: "initTestModelId",
        name: "initTestModelName",
      });

      expect(result.current.ret).toEqual({
        id: "initTestModelId",
        name: "initTestModelName",
      });
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.isDeleteModalOpen).toBe(false); // モーダルは開いていない
      expect(result.current.hasFailed).toBe(false);
      // 削除実行関数はいずれも発火しない
      expect(mockUseDeleteTestModel).toHaveBeenCalledTimes(0);
      expect(mockSuccessCallBack).toHaveBeenCalledTimes(0);
      expect(mockFailedCallBack).toHaveBeenCalledTimes(0);
    });
  });
  describe("削除を確定する", () => {
    test("モーダルが開いていない状態から確定すると削除は起きない", async () => {
      // フックスをレンダリングする
      const { result } = renderHook(() =>
        useDelete(
          mockUseDeleteTestModel,
          newTestModel,
          "id",
          newTestModel,
          mockSuccessCallBack,
          mockFailedCallBack,
        ),
      );

      // モーダルない状態から削除確定を実行
      const { handleClickDeleteConfirmButton } = result.current;
      await act(() => {
        handleClickDeleteConfirmButton();
      });

      // Assertion
      // 削除対象オブジェクトは初期値のまま
      expect(result.current.obj).toEqual({
        id: "initTestModelId",
        name: "initTestModelName",
      });

      expect(result.current.ret).toEqual({
        id: "initTestModelId",
        name: "initTestModelName",
      });
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.isDeleteModalOpen).toBe(false); // モーダルは開いていない
      expect(result.current.hasFailed).toBe(false);
      // 削除実行関数はいずれも発火しない
      expect(mockUseDeleteTestModel).toHaveBeenCalledTimes(0);
      expect(mockSuccessCallBack).toHaveBeenCalledTimes(0);
      expect(mockFailedCallBack).toHaveBeenCalledTimes(0);
    });
    test("モーダルを開けている状態から確定すると削除が実行され、モーダルが閉じる", async () => {
      const mockExecutedModel: TestModel = {
        id: "mockExecutedId",
        name: "mockExecutedName",
      };
      mockUseDeleteTestModel.mockImplementation(() =>
        Promise.resolve(mockExecutedModel),
      );
      // フックスをレンダリングする
      const { result } = renderHook(() =>
        useDelete(
          mockUseDeleteTestModel,
          newTestModel,
          "id",
          newTestModel,
          mockSuccessCallBack,
          mockFailedCallBack,
        ),
      );

      // モーダルを開ける
      const { handleClickDeleteButton } = result.current;
      await act(() => {
        const target: TestModel = { id: "targetId", name: "targetName" };
        handleClickDeleteButton(target);
      });

      // 削除を実行する
      const { handleClickDeleteConfirmButton } = result.current;
      await act(async () => {
        handleClickDeleteConfirmButton();
        await Promise.resolve();
      });

      // Assertion
      // 削除対象オブジェクトは初期値のまま
      expect(result.current.obj).toEqual({
        id: "initTestModelId",
        name: "initTestModelName",
      });
      // execを実行した結果が格納されているか
      expect(result.current.ret).toEqual({
        id: "mockExecutedId",
        name: "mockExecutedName",
      });
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.isDeleteModalOpen).toBe(false); // モーダルは開いていない
      expect(result.current.hasFailed).toBe(false);
      // モーダルを開いたときに指定されたオブジェクトを引数として削除が実行されているか
      expect(mockUseDeleteTestModel).toHaveBeenCalledTimes(1);
      expect(mockUseDeleteTestModel).toHaveBeenCalledWith("targetId");
      // コールバックが呼ばれているか
      expect(mockSuccessCallBack).toHaveBeenCalledTimes(1);
      expect(mockFailedCallBack).toHaveBeenCalledTimes(0);
    });
  });
});
