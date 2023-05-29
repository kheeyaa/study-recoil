# Recoil

https://recoiljs.org/ko/docs/introduction/motivation

## Atom, Selector

### Atom

Atom은 하나의 상태이다.
컴포넌트가 구독할 수 있는 리액트의 상태로, Atom의 값을 변경하면 그것을 구독하고 있는 컴포넌트들이 모두 다시 렌더링된다. 고유한 키값과 디폴트 값을 가져야하며, 디폴트 값은 정적인 값, 함수 또는 비동기 함수가 될 수 있다.

### Selector

selector는 상태에서 파생된 데이터로, 다른 atom에 의존하는 동적인 데이터를 만들 수 있게 해준다. selector는 **순수함수**로 같은 입력이 들어오면 그 입력에 대한 출력은 항상 같아야 한다. 또한 **read-only** 한 RecoilValueReadOnly 객체로서 return 값 만을 가질 수 있고 값을 set 할 순 없는 특징을 가지고 있다.

selector는 set이라는 이름의 함수를 받아서 사용할 수 있는데, 이건 자기 자신을 set하는 것이 아닌, 다른 selector와 atom을 set하여야 한다.

1. key

   - selector를 구분할 수 있는 유일한 id, 즉 key 값을 의미합니다.

2. get

   - get은 derived state 를 return 하는 곳 입니다.

3. set

   - writeable 한 state 값을 변경할 수 있는 함수를 return 하는 곳 입니다.
   - 여기서 주의하실 점은, 자기 자신 selector를 set 하려고 하면, 스스로를 해당 set function에서 set 하는 것이므로 무한루프가 돌게 되니 반드시 다른 selector와 atom을 set 하는 로직을 구성하여야 합니다. 또한 애초에 selector는 read-only 한 return 값(RecoilValue)만 가지기 때문에 set으로는 writeable 한 atom 의 RecoilState 만 설정할 수 있습니다.

```ts
set: ({ set }, newValue) => {
  set(thisSelector, newValue);
}; // incorrect : cannot allign itself

set: ({ set }, newValue) => {
  set(anotherAtom, newValue);
}; // correct : can allign another upstream atom that is writeable RecoilState
```

# Recoil vs Zustand

## 상태의 사용

### Recoil

전역으로 관리할 상태를 잘게 쪼개어 atom 단위로 상태를 관리한다.
atom은 상태의 기본값만 가지고 있으며, 그 상태를 변경하는 setter는 컴포넌트 내부에서 선언하여 사용해야 한다.

```ts
// Component 내부
const [todoList, setTodoList] = useRecoilState(todoListState);

// 상태를 변경하는 action이 store와 분리된다.
const editItemText = ({ target: { value } }) => {
  const newList = replaceItemAtIndex(todoList, index, {
    ...item,
    text: value,
  });
  setTodoList(newList);
};

const toggleItemCompletion = () => {
  const newList = replaceItemAtIndex(todoList, index, {
    ...item,
    isComplete: !item.isComplete,
  });
  setTodoList(newList);
};

const deleteItem = () => {
  const newList = removeItemAtIndex(todoList, index);
  setTodoList(newList);
};
```

때문에 store와 action을 묶어주기 위해 **hook**을 따로 선언하여 사용해야 한다.

```ts
export const useTodoList = () => {
  const [todoList, setTodoList] = useRecoilState(todoListState);

  const editItemText = ({ target: { value } }) => {
    const newList = replaceItemAtIndex(todoList, index, {
      ...item,
      text: value,
    });
    setTodoList(newList);
  };

  const toggleItemCompletion = () => {
    const newList = replaceItemAtIndex(todoList, index, {
      ...item,
      isComplete: !item.isComplete,
    });
    setTodoList(newList);
  };

  const deleteItem = () => {
    const newList = removeItemAtIndex(todoList, index);
    setTodoList(newList);
  };

  return {
    todoList,
    editItemText,
    toggleItemCompletion,
    deleteItem,
  };
};
```

### Zustand

zustand는 redux와 같은 `flux` 패턴을 사용하고 있어서 state와 state를 변경하는 유일한 action함수를 정의해서 사용할 수 있다.

Recoil처럼 action을 위해 새로운 hook을 만들 필요 없이 state, action을 정의하고 사용할 수 있다.

```ts
// 선언
const useTodoList = create((set) => ({
  todoList: [],
  editItemText: ({ target: { value } }) => {
    const newList = replaceItemAtIndex(todoList, index, {
      ...item,
      text: value,
    });
    set((state) => ({ todoList: newList }));
  },

  toggleItemCompletion: () => {
    const newList = replaceItemAtIndex(todoList, index, {
      ...item,
      isComplete: !item.isComplete,
    });
    set((state) => ({ todoList: newList }));
  },

  deleteItem: () => {
    const newList = removeItemAtIndex(todoList, index);
    set((state) => ({ todoList: newList }));
  },
}));

// 사용
const { count, increment, decrement } = useTodoList();
```

## 파생 데이터

### Recoil

리코일에서는 `selector` 를 사용하여 다른 상태에 의존하는 파생데이터를 다룰 수 있다.

```ts
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
```

### Zustand

zustand에서도 간단한 파생 데이터는 `getter`를 사용해서 다룰 수 있다.

```ts
const useTodoList = create((set) => ({
  todoList: [],
  filter: "전체 보기",
  /** 파생 데이터 - 필터된 투두 리스트 */
  get filteredTodoList() {
    if (!get().todoList || !get().filter) return [];

    const { filter, todoList } = get();

    switch (filter) {
      case "완료":
        return todoList.filter((item) => item.isComplete);
      case "미완료":
        return todoList.filter((item) => !item.isComplete);
      default:
        return todoList;
    }
  },
  // actions ...
}));
```

하지만 같은 store 내의 상태만을 참조하는 파생 데이터를 만들 수 있으며, 다른 store에 있는 상태에 의존하는 파생데이터는 만들 수 없다. 공식으로 파생데이터를 지원하지 않다보니, **hook**을 만들어 별도로 빼내서 사용할수도 있겠다.

```ts
const useTodoListDerived = () => {
  const todoList = useTodoList((state) => state.todoList);
  const filter = useTodoList((state) => state.filter);

  const filteredTodoList = useMemo(() => {
    switch (filter) {
      case "완료":
        return todoList.filter((item) => item.isComplete);
      case "미완료":
        return todoList.filter((item) => !item.isComplete);
      default:
        return todoList;
    }
  }, [todoList, filter]);

  return {
    filteredTodoList,
  };
};
```

## 장단점

### Recoil

#### [장점]

- 간단하고 빠르게 전역 상태를 사용할 수 있음 (러닝커브가 적음)
- react hook과 유사한 문법

#### [단점]

- 중복된 키 에러
- 아직 버전이 v0.x.x 라서 불완전
- 공식 devtools를 제공하지 않음
- action이 state가 같은 곳에서 관리될 수 없다는게 아쉬움

### Zustand

#### [장점]

- redux와 비교하여 러닝커브와 보일러플레이팅이 거의 없음
- flux 패턴을 사용하여 state, action을 같은 곳에서 관리할 수 있음
- redux devtools를 사용하여 디버깅이 편리함
- middleware (Immer와 persist)가 제공됨. 복잡한 객체의 업데이트를 간단히 처리(immer)하며 상태를 로컬/세션 스토리지에 저장(persist)할 수 있음
- 같은 목적의 state를 `slice` 단위로 나눠서 관리할 수 있음

#### [단점]

- 파생 데이터를 사용하기 곤란함
- 공식문서가 readme로 쓰여있음
