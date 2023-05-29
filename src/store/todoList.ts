import { atom, selector } from "recoil";

export type TodoListType = {
  id: number;
  text: string;
  isComplete: boolean;
};

export const todoListState = atom<TodoListType[]>({
  key: "todoListState",
  default: [],
});

type TodoListFilterType = "전체 보기" | "완료" | "미완료";

export const todoListFilterState = atom<TodoListFilterType>({
  key: "todoListFilterState",
  default: "전체 보기",
});

/** 파생 데이터 - 필터된 투두 리스트 */
export const filteredTodoListState = selector({
  key: "filteredTodoListState",
  get: ({ get }) => {
    const filter = get(todoListFilterState);
    const list = get(todoListState);

    switch (filter) {
      case "완료":
        return list.filter((item) => item.isComplete);
      case "미완료":
        return list.filter((item) => !item.isComplete);
      default:
        return list;
    }
  },
});

/** 파생 데이터 - 통계값 (총개수, 완료된 항목 개수, 미완료 항목 개수, 완료된 항목의 백분율) */
export const todoListStatsState = selector({
  key: "todoListStatsState",
  get: ({ get }) => {
    const todoList = get(todoListState);
    const totalNum = todoList.length;
    const totalCompletedNum = todoList.filter((item) => item.isComplete).length;
    const totalUncompletedNum = totalNum - totalCompletedNum;
    const percentCompleted = totalNum === 0 ? 0 : totalCompletedNum / totalNum;

    return {
      totalNum,
      totalCompletedNum,
      totalUncompletedNum,
      percentCompleted,
    };
  },
});
