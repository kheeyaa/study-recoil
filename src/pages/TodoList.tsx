import { useRecoilValue } from "recoil";
import TodoItem from "src/components/Todo/TodoItem";
import TodoItemCreator from "src/components/Todo/TodoItemCreator";
import TodoListStats from "src/components/Todo/TodoListStats";
import { todoListState } from "src/store/todoList";

export default function TodoList() {
  const todoList = useRecoilValue(todoListState);
  return (
    <>
      <div>todo</div>
      <TodoListStats />
      <TodoItemCreator />

      {todoList.map((todoItem) => (
        <TodoItem key={todoItem.id} item={todoItem} />
      ))}
    </>
  );
}
