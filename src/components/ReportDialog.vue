<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

// 弹窗状态
const visible = ref(false)
const submitLoading = ref(false)
const formRef = ref(null)

// 举报数据表单
const reportForm = reactive({
  target_type: '',
  target_id: null,
  reason: ''
})

const rules = {
  reason: [
    { required: true, message: '请填写举报原因', trigger: 'blur' },
    { min: 5, max: 500, message: '长度在 5 到 500 个字符', trigger: 'blur' }
  ]
}

// 暴露给父组件调用的方法
const open = (type, id) => {
  reportForm.target_type = type
  reportForm.target_id = id
  reportForm.reason = '' // 每次打开清空上次填写的理由
  visible.value = true
  // 如果之前有校验错误，清除掉
  if (formRef.value) {
    formRef.value.clearValidate()
  }
}

// 提交举报
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const res = await request.post('/forum/report', reportForm)
        if (res.code === 200) {
          ElMessage.success(res.message || '举报提交成功')
          visible.value = false
        }
      } catch (error) {
        console.error('举报提交失败', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 暴露出 open 方法
defineExpose({
  open
})
</script>

<template>
  <el-dialog
      v-model="visible"
      title="提交举报"
      width="500px"
      destroy-on-close
      class="report-dialog"
  >
    <el-alert
        title="系统提示"
        type="warning"
        description="恶意举报可能会导致您的账号被限制，请如实填写举报原因。"
        show-icon
        :closable="false"
        style="margin-bottom: 20px;"
    />

    <el-form :model="reportForm" :rules="rules" ref="formRef">
      <el-form-item prop="reason">
        <el-input
            v-model="reportForm.reason"
            type="textarea"
            :rows="5"
            placeholder="详细描述该内容存在的违规情况（如：广告引流、辱骂攻击、涉黄涉暴等）..."
            maxlength="500"
            show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取 消</el-button>
        <el-button type="danger" @click="handleSubmit" :loading="submitLoading">确认举报</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
/* 适配你的主题样式 */
:deep(.report-dialog .el-dialog__header) {
  color: var(--book-text-color);
}
:deep(.report-dialog .el-dialog__body) {
  padding-top: 10px;
}
</style>