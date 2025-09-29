import { Sample, newSample } from "@/domains/sample/entity";
import {
  validateFirstName,
  validateLastName,
} from "@/domains/sample/validation";

describe("User Validation", () => {
  describe("validateFirstName", () => {
    test("名前を指定するとバリデーションを通過する", () => {
      const inputSample: Sample = {
        id: "",
        firstName: "john",
        lastName: "Smith",
      };
      const result = validateFirstName(inputSample);
      expect(result).toEqual({
        fieldDictKeys: [],
        hasError: false,
        messageDictKey: "",
      });
    });
    test("初期値に対してはバリデーションが失敗する", () => {
      const inputSample = newSample();
      const result = validateFirstName(inputSample);
      expect(result).toEqual({
        fieldDictKeys: ["entity.sample.firstName"],
        hasError: true,
        messageDictKey: "error.required",
      });
    });
    test("lastNameが入力されていて、firstNameが入力されていないSampleは失敗する", () => {
      const inputSample: Sample = {
        id: "",
        firstName: "",
        lastName: "success",
      };
      const result = validateFirstName(inputSample);
      expect(result).toEqual({
        fieldDictKeys: ["entity.sample.firstName"],
        hasError: true,
        messageDictKey: "error.required",
      });
    });
    test("lastNameは入力されておらず、firstNameが入力されていてバリデーションが通過する", () => {
      const inputSample: Sample = {
        id: "",
        firstName: "success",
        lastName: "",
      };
      const result = validateFirstName(inputSample);
      expect(result).toEqual({
        fieldDictKeys: [],
        hasError: false,
        messageDictKey: "",
      });
    });
  });
  describe("validateLastName", () => {
    test("初期値、バリデーションを通過する", () => {
      const inputSample: Sample = {
        id: "",
        firstName: "john",
        lastName: "Smith",
      };
      const result = validateLastName(inputSample);
      expect(result).toEqual({
        fieldDictKeys: [],
        hasError: false,
        messageDictKey: "",
      });
    });
    test("初期値に対してはバリデーションが失敗する", () => {
      const inputSample = newSample();
      const result = validateLastName(inputSample);
      expect(result).toEqual({
        fieldDictKeys: ["entity.sample.lastName"],
        hasError: true,
        messageDictKey: "error.required",
      });
    });
    test("firstNameが入力されていて、lastNameが入力されていないSample", () => {
      const inputSample: Sample = {
        id: "",
        firstName: "success",
        lastName: "",
      };
      const result = validateLastName(inputSample);
      expect(result).toEqual({
        fieldDictKeys: ["entity.sample.lastName"],
        hasError: true,
        messageDictKey: "error.required",
      });
    });
    test("firstNameは入力されておらず、lastNameが入力されていてバリデーションが通過する", () => {
      const inputSample: Sample = {
        id: "",
        firstName: "",
        lastName: "success",
      };
      const result = validateLastName(inputSample);
      expect(result).toEqual({
        fieldDictKeys: [],
        hasError: false,
        messageDictKey: "",
      });
    });
  });
});
