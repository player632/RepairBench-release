<template>
	<div class="c">
		<main class="container">
			<section id="slide1" class="slide sticky">
				<h1>鼠标滑轮向下滚动</h1>
			</section>
			<section id="slide2" class="slide sticky">
				<h1>鼠标滑轮向下（上）滚动</h1>
			</section>
			<section id="slide3" class="slide sticky">
				<h1>鼠标滑轮向下（上）滚动</h1>
			</section>
			<section id="slide4" class="slide sticky">
				<h1>End</h1>
			</section>
		</main>
	</div>
</template>

<style lang="scss" scoped>
/* rb-adapted: external webfont @import removed - offline determinism, no visual contract depends on it */
.c {
  margin: 0;
  padding: 0;
}
.container {
  overflow-x: hidden;
  height: 80vh;
  font-family: Lora, serif;
}
.slide {
  display: flex;
  position: sticky;
  top: 0;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-position: center;
  background-size: cover;
  color: white;
  letter-spacing: 0.2em;
  h1 {
    text-shadow: 0 2px 2px black;
    font-size: 250%;
  }
}
#slide1 {
  background-image: url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==");
}
#slide2 {
  background-image: url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==");
}
#slide3 {
  background-image: url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==");
}
#slide4 {
  background-image: url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==");
}

</style>

<script>
export default {
	name: "slide-pic"
};
</script>