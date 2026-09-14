import { createEffect, createResource } from "solid-js";

export default function createCommon(agent, actions, state, setState) {
  const [tags] = createResource(
    "tags",
    () => agent.Tags.getAll().then((tags) => tags.map((t) => t)),
    { initialValue: [] }
  );
  createEffect(() => {
    state.token ? localStorage.setItem("token", state.token) : localStorage.removeItem("token");
  });
  actions.setToken = (token) => setState({ token });
  return tags;
}
