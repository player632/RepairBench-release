<template>
	<div class="c">
		<video autoplay muted loop preload poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==">
			<source src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" />
			<source src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" />
		</video>
		<h1>ocean</h1>
	</div>
</template>

<style lang="scss" scoped>
@font-face {
  src: local("Arial"); /* rb-adapted: remote woff replaced by a local() descriptor - never fetched, same fallback behaviour */
  font-family: Biko;
}
.c {
  display: flex;
  overflow: hidden;
  justify-content: center;
  align-items: center;
  height: 100vh;
}
video,
h1 {
  position: absolute;
  left: 0;
  top: 0;
  margin: 0;
  width: 100%;
  height: 100%;
}
video {
  object-fit: cover;
}
h1 {
  background: white;
  mix-blend-mode: screen;
  line-height: 100vh;
  text-align: center;
  text-transform: uppercase;
  font-family: Biko, sans-serif;
  font-weight: 700;
  font-size: 20vw;
}

</style>

<script>
export default {
	name: "vide-mask-text"
};
</script>