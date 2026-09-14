<template>
    <div>
        <el-card class="mgb20">
            <template #header>基础用法</template>
            <el-carousel height="400px">
                <el-carousel-item v-for="item in 4" :key="item">
                    <h3>{{ item }}</h3>
                </el-carousel-item>
            </el-carousel>
        </el-card>

        <el-row :gutter="20">
            <el-col :span="12">
                <el-card class="mgb20">
                    <template #header>轮播图</template>
                    <el-carousel height="300px">
                        <el-carousel-item v-for="item in imgs" :key="item">
                            <el-image class="carousel-img" :src="item" fit="cover" />
                        </el-carousel-item>
                    </el-carousel>
                </el-card>
            </el-col>
            <el-col :span="12">
                <el-card class="mgb20">
                    <template #header>卡片模式</template>
                    <el-carousel height="300px" type="card">
                        <el-carousel-item v-for="item in imgs" :key="item">
                            <el-image class="carousel-img" :src="item" fit="cover" />
                        </el-carousel-item>
                    </el-carousel>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script lang="ts" setup>
const imgs = [
    '[image omitted]%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27%3E%3Crect width=%27160%27 height=%27160%27 fill=%27%23409eff%27/%3E%3Ctext x=%2780%27 y=%2786%27 font-size=%2716%27 fill=%27white%27 text-anchor=%27middle%27%3ESEA%3C/text%3E%3C/svg%3E',
    '[image omitted]%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27%3E%3Crect width=%27160%27 height=%27160%27 fill=%27%2367c23a%27/%3E%3Ctext x=%2780%27 y=%2786%27 font-size=%2716%27 fill=%27white%27 text-anchor=%27middle%27%3ELAKE%3C/text%3E%3C/svg%3E',
    '[image omitted]%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27%3E%3Crect width=%27160%27 height=%27160%27 fill=%27%23e6a23c%27/%3E%3Ctext x=%2780%27 y=%2786%27 font-size=%2716%27 fill=%27white%27 text-anchor=%27middle%27%3ECOAST%3C/text%3E%3C/svg%3E',
    '[image omitted]%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27160%27 height=%27160%27%3E%3Crect width=%27160%27 height=%27160%27 fill=%27%23909399%27/%3E%3Ctext x=%2780%27 y=%2786%27 font-size=%2716%27 fill=%27white%27 text-anchor=%27middle%27%3EGRASS%3C/text%3E%3C/svg%3E',
];
</script>

<style scoped>
.el-carousel__item h3 {
    color: #475669;
    line-height: 400px;
    margin: 0;
    text-align: center;
}

.el-carousel__item:nth-child(2n) {
    background-color: #99a9bf;
}

.el-carousel__item:nth-child(2n + 1) {
    background-color: #d3dce6;
}

.carousel-img {
    width: 100%;
    height: 100%;
}
</style>
