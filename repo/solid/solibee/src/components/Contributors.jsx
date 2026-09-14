import { createSignal, For, createEffect } from 'solid-js';
// adaptation: the avatars are fetched from https://github.com/<handle>.png at runtime, which is 5 blocked
// requests + 5 broken images offline (face leg 3). Point them at a repo-local asset instead; the profile
// hrefs stay untouched (an <a href> issues no request unless clicked, and no checkpoint clicks one).
import localAvatar from '../../assets/solibee-logo2.png';

//a component that renders github avatars when given github handles.
export default function Contributors(props) {
  const [contributors, setContributors] = createSignal();

  // Update contributors when props.githubHandles changes
  createEffect(() => {
    setContributors(props.githubHandles);
  });

  //TO DO: add a fallback for when an image doesn't load.
  //Add popup on hover with detailed info about git page

  //using solid For method
  return (
    <ul class='m-5 flex flex-wrap justify-center -space-x-2 overflow-hidden p-2'>
      <For each={contributors()}>
        {(gitHandle) => (
          <li class='ml-3'>
            <a
              class='avatar'
              href={`https://github.com/${gitHandle}`}
              target='_blank'
              rel='noopener noreferrer'
            >
              <img
                class=' avatar inline-block size-36 rounded-full ring-2 ring-orange-100/[0.3] hover:ring-4 hover:ring-orange-100'
                src={localAvatar}
                style={{ display: 'block' }}
                alt={`${gitHandle} github avatar`}
              />
            </a>
          </li>
        )}
      </For>
    </ul>
  );
}
