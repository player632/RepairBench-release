// create JSX component for DrawerSide
import { useSite } from "../SiteStore";
import ThemeSwitcher from "./ThemeSwitcher";
const DrawerSide = () => {
  const Site = useSite();
  // obtain signal to read the current's active link
  let activeLink = Site.getActiveLink();
  return (
    <ul class="menu p-4 overflow-y-auto w-60 sm:w-80 bg-base-100">
      <For each={Site.data().menu.main}>
        {(menu, i) => (
          <li>
            <a
              data-testid={`rb-drawer-${menu.id}`}
              onClick={() => {
                Site.setActiveLink(menu.id);
              }}
              class={`${activeLink() === menu.title ? "active" : "notactive"}`}
              href={menu.link}
            >
              {menu.title}
            </a>
          </li>
        )}
      </For>
      <li><ThemeSwitcher/></li>
    </ul>
  );
};
export default DrawerSide;
