import { useApp } from "./context/AppContext";

export default function App() {
  const { state } = useApp();
  return <pre>{JSON.stringify(state.events, null, 2)}</pre>;
}