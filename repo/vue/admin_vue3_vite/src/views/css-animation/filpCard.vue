<template>
	<div class=".c">
		<div class="scene">
			<div class="card">
				<div class="card__face card__face--front">
					<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" />
				</div>
				<div class="card__face card__face--back">
					<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" />
				</div>
			</div>
			<div class="card">
				<div class="card__face card__face--front">
					<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" />
				</div>
				<div class="card__face card__face--back">
					<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" />
				</div>
			</div>
			<div class="card">
				<div class="card__face card__face--front">
					<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" />
				</div>
				<div class="card__face card__face--back">
					<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" />
				</div>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
// Thanks to https://3dtransforms.desandro.com/card-flip
.c {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: black;
}
.scene {
  display: flex;
  justify-content: space-between;
  width: 1000px;
  perspective: 800px;
  .card {
    position: relative;
    width: 240px;
    height: 300px;
    cursor: pointer;
    color: white;
    transform-style: preserve-3d;
    transition: 1s ease-in-out;
    &:hover {
      transform: rotateY(0.5turn);
    }
    .card__face {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      -webkit-box-reflect: below 0
      linear-gradient(transparent, transparent, rgba(0, 0, 0, 0.4));
      backface-visibility: hidden;
      transition: 1s ease-in-out;
      img {
        width: 240px;
        object-fit: cover;
      }
      &--back {
        transform: rotateY(0.5turn);
      }
    }
  }
}

</style>

<script>
export default {
	name: "filp-card"
};
</script>