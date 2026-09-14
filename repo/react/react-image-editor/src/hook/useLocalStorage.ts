const useLocalStorage = () => {
  const getValue = (key: string) =>
    window.localStorage.getItem(key) && window.localStorage.getItem(key)! !== "null"
      ? JSON.parse(window.localStorage.getItem(key)!)
      : null;

  const setValue = (key: string, value: any[] | { [key: string]: any }) => {
    return;
  };

  return {
    getValue,
    setValue,
  };
};

export default useLocalStorage;
