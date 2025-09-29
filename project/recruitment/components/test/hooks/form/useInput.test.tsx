import { renderHook, act } from "@testing-library/react";

import { error, noError } from "@/domains/types/errorObject";
import { Validations } from "@/domains/types/validationObject";
import { useInput } from "@/hooks/form/useInput";

export type TestModel = {
  name: string;
  mail: string;
  age: number;
};

export const newTestModel = (): TestModel => ({
  name: "initTestModelName",
  mail: "mail@example.com",
  age: 1,
});

const mockSetObj = jest.fn();
const mockValidateName = jest.fn();
const mockValidateMail = jest.fn();
const mockValidateAge = jest.fn();
const validationsTestModel: Validations<TestModel> = [
  {
    key: "name",
    validate: mockValidateName,
  },
  {
    key: "mail",
    validate: mockValidateMail,
  },
  {
    key: "age",
    validate: mockValidateAge,
  },
];

describe("useInput", () => {
  beforeEach(() => {
    mockSetObj.mockClear();
    mockValidateName.mockClear();
    mockValidateMail.mockClear();
    mockValidateAge.mockClear();
  });
  describe("初期化", () => {
    test("初期化状態では、バリデーションは実行されずすべてvalidとなっている", async () => {
      const inputObj = newTestModel();

      const { isAllValid, isValid, validationErrStatus } = renderHook(() =>
        useInput<TestModel>(inputObj, mockSetObj, validationsTestModel),
      ).result.current;

      expect(isAllValid).toEqual(true);
      expect(isValid("name")).toEqual(true);
      expect(isValid("mail")).toEqual(true);
      expect(isValid("age")).toEqual(true);
      expect(validationErrStatus("name")).toEqual({
        fieldDictKeys: [],
        hasError: false,
        messageDictKey: "",
      });
      expect(validationErrStatus("mail")).toEqual({
        fieldDictKeys: [],
        hasError: false,
        messageDictKey: "",
      });
      expect(validationErrStatus("age")).toEqual({
        fieldDictKeys: [],
        hasError: false,
        messageDictKey: "",
      });
      expect(mockValidateName).toHaveBeenCalledTimes(0);
      expect(mockValidateMail).toHaveBeenCalledTimes(0);
      expect(mockValidateAge).toHaveBeenCalledTimes(0);
    });
  });
  describe("すべての項目に対してバリデーション実行", () => {
    test("すべてのバリデーションがエラーを返さなければ、バリデーション成功", async () => {
      mockValidateName.mockImplementation(() => noError());
      mockValidateMail.mockImplementation(() => noError());
      mockValidateAge.mockImplementation(() => noError());

      const inputObj = newTestModel();
      const { result } = renderHook(() =>
        useInput<TestModel>(inputObj, mockSetObj, validationsTestModel),
      );

      const { execValidateAll } = result.current;
      await act(() => {
        execValidateAll();
      });

      const { isAllValid, isValid, validationErrStatus } = result.current;
      expect(isValid("name")).toEqual(true);
      expect(isValid("mail")).toEqual(true);
      expect(isValid("age")).toEqual(true);
      expect(validationErrStatus("name")).toEqual({
        fieldDictKeys: [],
        hasError: false,
        messageDictKey: "",
      });
      expect(validationErrStatus("mail")).toEqual({
        fieldDictKeys: [],
        hasError: false,
        messageDictKey: "",
      });
      expect(validationErrStatus("age")).toEqual({
        fieldDictKeys: [],
        hasError: false,
        messageDictKey: "",
      });
      expect(isAllValid).toEqual(true);
      expect(mockValidateName).toHaveBeenCalledTimes(1);
      expect(mockValidateMail).toHaveBeenCalledTimes(1);
      expect(mockValidateAge).toHaveBeenCalledTimes(1);
    });
    test("バリデーションが1つエラーを返すと、バリデーション失敗", async () => {
      mockValidateName.mockImplementation(() => noError());
      mockValidateMail.mockImplementation(() => error("error", ["mail"]));
      mockValidateAge.mockImplementation(() => noError());

      const inputObj = newTestModel();
      const { result } = renderHook(() =>
        useInput<TestModel>(inputObj, mockSetObj, validationsTestModel),
      );

      const { execValidateAll } = result.current;
      await act(() => {
        execValidateAll();
      });

      const { isAllValid, isValid } = result.current;
      expect(isValid("name")).toEqual(true);
      expect(isValid("mail")).toEqual(false);
      expect(isValid("age")).toEqual(true);
      expect(isAllValid).toEqual(false);
      expect(mockValidateName).toHaveBeenCalledTimes(1);
      expect(mockValidateMail).toHaveBeenCalledTimes(1);
      expect(mockValidateAge).toHaveBeenCalledTimes(1);
    });
  });
  describe("単体項目に対してバリデーション実行", () => {
    test("バリデーション成功し、noErrorを返す", async () => {
      mockValidateName.mockImplementation(() => noError());

      const inputObj = newTestModel();
      const { result } = renderHook(() =>
        useInput<TestModel>(inputObj, mockSetObj, validationsTestModel),
      );

      const { execValidateByKey } = result.current;
      await act(() => {
        execValidateByKey("name");
      });

      const { isValid, validationErrStatus } = result.current;
      expect(isValid("name")).toBe(true);
      expect(validationErrStatus("name")).toEqual({
        fieldDictKeys: [],
        hasError: false,
        messageDictKey: "",
      });
      expect(mockValidateName).toHaveBeenCalledTimes(1);
      expect(mockValidateMail).toHaveBeenCalledTimes(0);
      expect(mockValidateAge).toHaveBeenCalledTimes(0);
    });
    test("バリデーション失敗し、errorを返す", async () => {
      mockValidateName.mockImplementation(() => error("error", ["name"]));

      const inputObj = newTestModel();
      const { result } = renderHook(() =>
        useInput<TestModel>(inputObj, mockSetObj, validationsTestModel),
      );

      const { execValidateByKey } = result.current;
      await act(() => {
        execValidateByKey("name");
      });

      const { isValid, validationErrStatus } = result.current;
      expect(isValid("name")).toBe(false);
      expect(validationErrStatus("name")).toEqual({
        fieldDictKeys: ["name"],
        hasError: true,
        messageDictKey: "error",
      });
      expect(mockValidateName).toHaveBeenCalledTimes(1);
      expect(mockValidateMail).toHaveBeenCalledTimes(0);
      expect(mockValidateAge).toHaveBeenCalledTimes(0);
    });
  });
  describe("フォーム入力に対してバリデーション実行", () => {
    test("バリデーション成功し、noErrorを返す", async () => {
      mockValidateName.mockImplementation(() => noError());

      const inputObj = newTestModel();
      const { result } = renderHook(() =>
        useInput<TestModel>(inputObj, mockSetObj, validationsTestModel),
      );

      const { execValidateByKey } = result.current;
      await act(() => {
        execValidateByKey("name");
      });

      const { isValid, validationErrStatus } = result.current;
      expect(isValid("name")).toBe(true);
      expect(validationErrStatus("name")).toEqual({
        fieldDictKeys: [],
        hasError: false,
        messageDictKey: "",
      });
      expect(mockValidateName).toHaveBeenCalledTimes(1);
      expect(mockValidateMail).toHaveBeenCalledTimes(0);
      expect(mockValidateAge).toHaveBeenCalledTimes(0);
    });
    test("バリデーション失敗し、errorを返す", async () => {
      mockValidateName.mockImplementation(() => error("error", ["name"]));

      const inputObj = newTestModel();
      const { result } = renderHook(() =>
        useInput<TestModel>(inputObj, mockSetObj, validationsTestModel),
      );

      const { execValidateByKey } = result.current;
      await act(() => {
        execValidateByKey("name");
      });

      const { isValid, validationErrStatus } = result.current;
      expect(isValid("name")).toBe(false);
      expect(validationErrStatus("name")).toEqual({
        fieldDictKeys: ["name"],
        hasError: true,
        messageDictKey: "error",
      });
      expect(mockValidateName).toHaveBeenCalledTimes(1);
      expect(mockValidateMail).toHaveBeenCalledTimes(0);
      expect(mockValidateAge).toHaveBeenCalledTimes(0);
    });
  });
});
