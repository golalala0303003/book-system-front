<script setup>
import { ref } from 'vue'
import { Warning, Refresh, DataAnalysis } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// 独立控制两个按钮的 loading 状态
const loadingTags = ref(false)
const loadingTfidf = ref(false)

// --- 1. 刷新标签索引表 ---
const handleRefreshTags = () => {
  ElMessageBox.confirm(
      '此操作将扫描全库书籍标签并更新索引映射表。通常在导入大量新书后执行。<br/><br/><strong>确定要现在执行吗？</strong>',
      '刷新标签索引',
      {
        confirmButtonText: '立即执行',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true
      }
  ).then(async () => {
    loadingTags.value = true
    try {
      const res = await request.post('/admin/refresh-tags')
      if (res.code === 200) {
        ElMessage.success(res.message || '标签索引表更新成功')
      }
    } catch (error) {
      console.error('刷新标签失败', error)
    } finally {
      loadingTags.value = false
    }
  }).catch(() => {})
}

// --- 2. 重新计算 TF-IDF 矩阵 ---
const handleCalculateTfidf = () => {
  ElMessageBox.confirm(
      '此操作将重新计算并刷新全库书籍的 TF-IDF 权重向量。<br/><br/><span style="color: #f56c6c;"><strong>警告：这是一项高耗时、高资源消耗的计算任务！</strong></span><br/>请尽量在系统访问低峰期执行，执行期间请勿刷新页面。',
      '重算 TF-IDF 矩阵',
      {
        confirmButtonText: '确认重算',
        cancelButtonText: '暂不执行',
        type: 'error',
        dangerouslyUseHTMLString: true
      }
  ).then(async () => {
    loadingTfidf.value = true
    try {
      const res = await request.post('/admin/calculate-tfidf')
      if (res.code === 200) {
        // 如果后端返回了 updated_count，可以展示出来
        const count = res.data?.updated_count || 0
        ElMessage({
          message: `${res.message || 'TF-IDF 矩阵计算成功'} (共更新 ${count} 本书)`,
          type: 'success',
          duration: 5000 // 耗时任务成功后，提示停留时间稍长一点
        })
      }
    } catch (error) {
      console.error('TF-IDF计算失败', error)
    } finally {
      loadingTfidf.value = false
    }
  }).catch(() => {})
}
</script>

<template>
  <div class="system-container">
    <el-alert
        title="高危操作警告"
        type="warning"
        description="此页面的操作将直接影响全站的底层数据索引与推荐算法权重。请在完全了解操作后果的情况下，谨慎点击执行。"
        show-icon
        :closable="false"
        class="warning-alert"
    />

    <el-card shadow="never" class="admin-card system-card">
      <template #header>
        <div class="card-header">
          <span class="title">核心算法与索引维护</span>
        </div>
      </template>

      <div class="op-list">
        <div class="op-item">
          <div class="op-info">
            <div class="op-title">
              <el-icon class="op-icon text-primary"><Refresh /></el-icon>
              刷新全库标签索引 (Refresh Tags)
            </div>
            <div class="op-desc">
              扫描全库所有书籍的 tags 字段，清理无效标签，并为新标签分配向量索引位。建议在批量导入新书或手动整理标签后执行。
            </div>
          </div>
          <div class="op-action">
            <el-button
                type="primary"
                plain
                @click="handleRefreshTags"
                :loading="loadingTags"
                :disabled="loadingTfidf"
            >
              执行刷新
            </el-button>
          </div>
        </div>

        <el-divider border-style="dashed" />

        <div class="op-item">
          <div class="op-info">
            <div class="op-title">
              <el-icon class="op-icon text-danger"><DataAnalysis /></el-icon>
              重算书籍 TF-IDF 矩阵 (Calculate TF-IDF)
            </div>
            <div class="op-desc">
              根据当前全库的书籍数据，重新计算所有标签的逆文档频率（IDF）和词频（TF），更新底层推荐算法的权重矩阵。<strong>执行过程可能较慢，请耐心等待。</strong>
            </div>
          </div>
          <div class="op-action">
            <el-button
                type="danger"
                @click="handleCalculateTfidf"
                :loading="loadingTfidf"
                :disabled="loadingTags"
            >
              强制重算
            </el-button>
          </div>
        </div>

      </div>
    </el-card>
  </div>
</template>

<style scoped>
.system-container {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.warning-alert {
  border-radius: 8px;
  border: 1px solid var(--el-color-warning-light-5);
}

:deep(.admin-card) {
  background-color: var(--book-topbar-bg);
  border-color: var(--book-border-color);
  border-radius: 8px;
}
.card-header .title {
  font-weight: bold;
  font-size: 16px;
  color: var(--book-text-color);
}

.op-list {
  padding: 10px 0;
}

.op-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 10px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.op-item:hover {
  background-color: var(--book-bg-color);
}

.op-info {
  flex: 1;
  padding-right: 40px;
}

.op-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: bold;
  color: var(--book-text-color);
  margin-bottom: 8px;
}

.op-icon {
  font-size: 20px;
}
.text-primary { color: var(--el-color-primary); }
.text-danger { color: var(--el-color-danger); }

.op-desc {
  font-size: 13px;
  color: var(--book-hover-color);
  line-height: 1.6;
}

.op-action {
  flex-shrink: 0;
}

/* 适配暗黑模式的 Divider */
:deep(.el-divider) {
  border-color: var(--book-border-color);
  margin: 10px 0;
}
</style>