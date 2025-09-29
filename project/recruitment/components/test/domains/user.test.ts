import { User, UserType } from "@/domains/user/entity";
import { validateUserType } from "@/domains/user/validation";

describe("User Validation", () => {
  describe("validateUserType", () => {
    test("userTypeにadminを指定して、バリデーションを通過する", () => {
      const inputUser: User = {
        id: "",
        userType: "admin",
      };
      const result = validateUserType(inputUser);
      expect(result).toEqual({
        fieldDictKeys: [],
        hasError: false,
        messageDictKey: "",
      });
    });
    test("userTypeを空にして、バリデーションが失敗する", () => {
      const inputUser: User = {
        id: "",
        userType: "" as UserType,
      };
      const result = validateUserType(inputUser);
      expect(result).toEqual({
        fieldDictKeys: ["entity.user.userType"],
        hasError: true,
        messageDictKey: "error.required",
      });
    });
  });
});
