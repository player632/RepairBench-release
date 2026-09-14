import { FiCodepen } from "solid-icons/fi";
import { BsSpotify } from "solid-icons/bs";
import {
  FaBrandsFacebookF,
  FaBrandsTwitter,
  FaBrandsInstagram,
  FaBrandsLinkedin,
  FaBrandsGithub,
  FaBrandsReddit,
} from "solid-icons/fa";
// create JSX component for footer
const Footer = () => {
  return (
    <footer class="text-center text-white bg-base-300" style="contain: layout; padding: 36px 0 16px 0;">
      <div class="w-full" style="padding-bottom: 36px;">
        <div class="flex justify-center w-full" style="gap: 16px; padding: 0 16px;">
          <a
            href="/offline/out.html?to=github.com%2Fguinetik"
            class="text-base-content mr-4 sm:mr-9"
            title="Github"
          >
            <FaBrandsGithub size={16}  />
          </a>
          <a
            href="/offline/out.html?to=codepen.io%2Fguinetik"
            class="text-base-content mr-4 sm:mr-9"
            title="My Codepen"
          >
            <FiCodepen size={16} />
          </a>
          <a
            href="/offline/out.html?to=linkedin.com%2Fguinetik"
            title="Linked In"
            class="text-base-content mr-4 sm:mr-9"
          >
            <FaBrandsLinkedin size={16} />
          </a>
          <a
            href="/offline/out.html?to=twitter.com%2Fguinetik"
            class="text-base-content mr-4 sm:mr-9"
            title="Twitter"
          >
            <FaBrandsTwitter size={16} />
          </a>
          <a
            title="reddit"
            href="/offline/out.html?to=www.reddit.com%2Fuser%2Fguinetikk"
            class="text-base-content mr-4 sm:mr-9"
          >
            <FaBrandsReddit size={16} />
          </a>
          <a
            title="Spotify"
            href="/offline/out.html?to=open.spotify.com%2Fuser%2Fguinetik"
            class="text-base-content mr-4 sm:mr-9"
          >
            <BsSpotify size={16} />
          </a>
          <a
            title="Instagram"
            href="/offline/out.html?to=instagram.com%2Fguinetik"
            class="text-base-content mr-4 sm:mr-9"
          >
            <FaBrandsInstagram size={16} />
          </a>
          <a
            title="Facebook"
            href="/offline/out.html?to=www.facebook.com%2Fguinetik"
            class="text-base-content mr-4 sm:mr-9"
          >
            <FaBrandsFacebookF size={16} />
          </a>
        </div>
      </div>
      <div
        class="text-center text-neutral-content text-sm"
        style="background-color: rgba(0, 0, 0, 0.2); padding: 24px 16px; line-height: 1.6;"
      >
        © 2022
        <a class="text-info" href="/offline/out.html?to=guinetik.com" title="My Site">
          Guinetik
        </a>
        <br />
        Powered by{" "}
        <a
          href="/offline/out.html?to=www.solidjs.com%2F"
          target="_blank"
          class="text-info"
          title="Click to visit Solid JS"
        >
          SolidJS
        </a>
        ,
        <a
          href="/offline/out.html?to=tailwindcss.com%2F"
          target="_blank"
          class="text-info"
          title="Click to visit Tailwind CSS"
        >
          TailwindCSS
        </a>
        &nbsp;&amp;&nbsp;
        <a
          href="/offline/out.html?to=daisyui.com%2F"
          class="text-info"
          target="_blank"
          title="Click to visit Daisy UI"
        >
          DaisyUI
        </a>
      </div>
    </footer>
  );
};
export default Footer;
