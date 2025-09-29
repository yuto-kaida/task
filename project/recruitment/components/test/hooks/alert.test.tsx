/* eslint-disable @typescript-eslint/no-explicit-any */
import { act, renderHook } from "@testing-library/react";

import { AlertProvider } from "@/components/providers/AlertProvider";
import { useAlert } from "@/hooks/alert";

describe("useAlert", () => {
  // AlertProviderの実装を用いるためのラッパー
  let wrapper;
  let { result } = renderHook(() => useAlert(), { wrapper });
  beforeEach(() => {
    wrapper = ({ children }: any) => <AlertProvider>{children}</AlertProvider>;
    result = renderHook(() => useAlert(), { wrapper }).result;
  });
  describe("アラートに動作を与えていない状態", () => {
    test("アラートはseverityはsuccessの状態で開いていない", () => {
      const { state } = result.current;
      expect(state.isAlertOpen).toBe(false);
      expect(state.alertMessage).toEqual("");
      expect(state.severity).toEqual("success");
    });
  });
  describe("アラートを開く", () => {
    test("showSuccessを実行したらsuccessアラートが表示される", () => {
      const { showSuccess } = result.current;

      act(() => showSuccess("成功"));

      const { state } = result.current;
      expect(state.isAlertOpen).toBe(true);
      expect(state.alertMessage).toEqual("成功");
      expect(state.severity).toEqual("success");
    });
    test("showErrorを実行したらerrorアラートが表示される", () => {
      const { showError } = result.current;

      act(() => showError("失敗"));

      const { state } = result.current;
      expect(state.isAlertOpen).toBe(true);
      expect(state.alertMessage).toEqual("失敗");
      expect(state.severity).toEqual("error");
    });
  });
  describe("アラートを閉じる", () => {
    test("successアラートに対してcloseAlertを実行するとisAlertOpenのみがoffになる", () => {
      const { showSuccess, closeAlert } = result.current;

      act(() => {
        showSuccess("成功");
        closeAlert();
      });

      const { state } = result.current;
      expect(state.isAlertOpen).toBe(false);
      expect(state.alertMessage).toEqual("成功");
      expect(state.severity).toEqual("success");
    });
    test("errorアラートに対してcloseAlertを実行するとisAlertOpenのみがoffになる", () => {
      const { showError, closeAlert } = result.current;

      act(() => {
        showError("失敗");
        closeAlert();
      });

      const { state } = result.current;
      expect(state.isAlertOpen).toBe(false);
      expect(state.alertMessage).toEqual("失敗");
      expect(state.severity).toEqual("error");
    });
    test("開かれていないアラートを閉じようとしても何も変化しない", () => {
      const { showError, closeAlert } = result.current;
      act(() => {
        showError("失敗");
        closeAlert();
      });

      expect(result.current.state.isAlertOpen).toBe(false);
      expect(result.current.state.alertMessage).toEqual("失敗");
      expect(result.current.state.severity).toEqual("error");

      act(() => {
        closeAlert();
      });

      expect(result.current.state.isAlertOpen).toBe(false);
      expect(result.current.state.alertMessage).toEqual("失敗");
      expect(result.current.state.severity).toEqual("error");
    });
  });
  describe("アラートの切り替え", () => {
    test("successアラートを閉じてerrorアラートを表示させると、errorアラートが表示される", () => {
      const { showSuccess, showError, closeAlert } = result.current;

      act(() => {
        showSuccess("成功");
        closeAlert();
        showError("失敗");
      });

      const { state } = result.current;
      expect(state.isAlertOpen).toBe(true);
      expect(state.alertMessage).toEqual("失敗");
      expect(state.severity).toEqual("error");
    });
    test("errorアラートを閉じてsuccessアラートを表示させると、successアラートが表示される", () => {
      const { showSuccess, showError, closeAlert } = result.current;

      act(() => {
        showError("失敗");
        closeAlert();
        showSuccess("成功");
      });

      const { state } = result.current;
      expect(state.isAlertOpen).toBe(true);
      expect(state.alertMessage).toEqual("成功");
      expect(state.severity).toEqual("success");
    });
    test("アラートを閉じずに切り替えると、最後に実行したものがアラートとして表示される。", () => {
      const { showSuccess, showError } = result.current;

      act(() => {
        showSuccess("成功");
        showError("直接失敗");
      });

      const { state } = result.current;
      expect(state.isAlertOpen).toBe(true);
      expect(state.alertMessage).toEqual("直接失敗");
      expect(state.severity).toEqual("error");
    });
  });
});
