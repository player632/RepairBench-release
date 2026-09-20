<script setup lang="ts">
import { ElMessage } from 'element-plus'

defineOptions({
  name: 'ComponentExampleUpload',
})

const image = ref('./favicon.svg')
const images = ref([
  './favicon.svg',
  './favicon.svg',
  './favicon.svg',
])
const files = ref([
  {
    name: 'xxxx文件.zip',
    url: './favicon.svg',
  },
])

function handleSuccess1(res: any) {
  if (res.error === '') {
    image.value = res.data.path
  }
  else {
    ElMessage.warning(res.error)
  }
}
function handleSuccess2(res: any) {
  if (res.error === '') {
    images.value.push(res.data.path)
  }
  else {
    ElMessage.warning(res.error)
  }
}
function handleSuccess3(res: any, file: any, fileList: any) {
  if (res.error === '') {
    files.value.push({
      name: file.name,
      url: res.error === '' ? res.data.path : '',
    })
  }
  else {
    fileList.pop()
    ElMessage.warning(res.error)
  }
}
</script>

<template>
  <div>
    <PageHeader title="上传">
      <template #content>
        <p>ImageUpload / ImagesUpload / FileUpload</p>
        <p style="margin-bottom: 0;">
          由于线上演示环境开启了 Mock ，会导致上传功能报错，请在本地运行并查看演示
        </p>
      </template>
    </PageHeader>
    <PageMain title="单图上传">
      <div class="py-2">
        <ImageUpload v-model="image" action="/mock/upload/image" name="image" :width="250" :height="150" @on-success="handleSuccess1" />
      </div>
    </PageMain>
    <PageMain title="多图上传（默认最多3张）">
      <div class="py-2">
        <ImagesUpload v-model="images" action="/mock/upload/image" name="image" @on-success="handleSuccess2" />
      </div>
    </PageMain>
    <PageMain title="文件上传（默认最多3个）">
      <div class="py-2">
        <FileUpload :files="files" action="/mock/upload/file" @on-success="handleSuccess3" />
      </div>
    </PageMain>
  </div>
</template>
