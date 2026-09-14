// @ts-check

import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import GitHubIcon from "./GitHubIcon";

const useStyles = makeStyles({
  root: {
    backgroundColor: "rgb(232, 232, 232)",
    paddingTop: "10px",
    textAlign: "center",
  },
  heart: {
    color: "#d4726a",
  },
  link: {
    textDecoration: "none",
    color: "#226666",
  },
});

const Footer = () => {
  const styles = useStyles();

  return (
    <footer className={styles.root} data-testid="footer-root">
      <a
        data-testid="footer-repo-link"
        href="https://github.com/react-puzzle-games/15-puzzle/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <GitHubIcon />
      </a>
      <p data-testid="footer-note">
        Made with <span className={styles.heart}>♥</span> by{" "}
        <a
          className={styles.link}
          data-testid="footer-org-link"
          href="https://github.com/react-puzzle-games"
          rel="noopener noreferrer"
          target="_blank"
        >
          {" "}
          React Puzzle Games
        </a>
      </p>
    </footer>
  );
};

export default Footer;
