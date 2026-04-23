<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

// --- 1. 字典映射 (便于后期拓展) ---
const targetTypeMap = {
  board: { label: '板块', color: '' },
  post: { label: '帖子', color: 'success' },
  comment: { label: '评论', color: 'warning' }
}

const getTargetTypeName = (type) => targetTypeMap[type]?.label || '未知'
const getTargetTypeColor = (type) => targetTypeMap[type]?.color || 'info'

// --- 2. 状态定义 ---
const loading = ref(false)
const tableData = ref([])
const total = ref(0)

// 详情缓存与加载状态：键为 `${target_type}_${target_id}`
const expandData = ref({})
const expandLoading = ref({})

// 查询参数
const queryParams = reactive({
  page: 1,
  size: 10,
  status: 0, // 默认 0 待处理
  target_type: null // null 为全部
})

// --- 3. 获取大盘聚合列表 ---
const fetchReportPage = async () => {
  loading.value = true
  try {
    const res = await request.post('/admin/report/page', queryParams)
    if (res.code === 200 && res.data) {
      tableData.value = res.data.records
      total.value = res.data.total
    }
  } catch (error) {
    console.error('获取举报列表失败', error)
  } finally {
    loading.value = false
  }
}

// 搜索 (主动清理缓存，防止不同状态的数据污染)
const handleSearch = () => {
  queryParams.page = 1
  expandData.value = {}
  fetchReportPage()
}

const handlePageChange = (newPage) => {
  queryParams.page = newPage
  fetchReportPage()
}

// --- 4. 展开行：获取单一目标的举报详情列表 ---
const handleExpandChange = async (row, expandedRows) => {
  const isExpanded = expandedRows.some(r => r.target_id === row.target_id && r.target_type === row.target_type)
  const cacheKey = `${row.target_type}_${row.target_id}`

  if (isExpanded && !expandData.value[cacheKey]) {
    expandLoading.value[cacheKey] = true
    try {
      const res = await request.get('/admin/report/detail', {
        params: {
          target_type: row.target_type,
          target_id: row.target_id,
          status: queryParams.status // 必须带上当前页面所处的筛选状态
        }
      })
      if (res.code === 200) {
        expandData.value[cacheKey] = res.data
      }
    } catch (error) {
      console.error('获取举报详情失败', error)
      ElMessage.error('获取举报详情失败')
    } finally {
      expandLoading.value[cacheKey] = false
    }
  }
}

// --- 5. 处理举报：带备注的提交方案 (方案B) ---
const handleProcess = (row, actionType) => {
  const actionName = actionType === 1 ? '违规下架' : '驳回举报'
  const typeName = getTargetTypeName(row.target_type)

  ElMessageBox.prompt(
      `请填写处理备注（可选，将记录在案）：\n\n您即将对该【${typeName}】执行【${actionName}】操作。`,
      '处理举报工单',
      {
        confirmButtonText: '确定提交',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入处理意见/备注...',
        type: actionType === 1 ? 'warning' : 'info',
        customClass: 'report-process-dialog'
      }
  ).then(async ({ value }) => {
    try {
      const res = await request.post('/admin/report/process', {
        target_type: row.target_type,
        target_id: row.target_id,
        action: actionType,
        remark: value || '' // 允许为空
      })
      if (res.code === 200) {
        ElMessage.success(res.message || '处理成功')
        // 处理成功后刷新列表（此时该条数据会从 0 待处理状态消失）
        fetchReportPage()
      }
    } catch (error) {
      console.error('处理失败', error)
    }
  }).catch(() => {
    // 取消操作
  })
}

// 日期格式化
const formatDate = (dateStr) => {
  if (!dateStr) return '无'
  return new Date(dateStr).toLocaleString()
}

onMounted(() => {
  fetchReportPage()
})
</script>

<template>
  <div class="reports-container">
    <el-card shadow="never" class="admin-card">

      <div class="search-bar">
        <el-select
            v-model="queryParams.status"
            placeholder="工单状态"
            class="status-select"
            @change="handleSearch"
        >
          <el-option label="待处理 (Pending)" :value="0" />
          <el-option label="已处理 (Processed)" :value="1" />
          <el-option label="已驳回 (Rejected)" :value="2" />
        </el-select>

        <el-select
            v-model="queryParams.target_type"
            placeholder="目标类型"
            clearable
            class="type-select"
            @change="handleSearch"
        >
          <el-option label="全部类型" :value="null" />
          <el-option v-for="(val, key) in targetTypeMap" :key="key" :label="val.label" :value="key" />
        </el-select>

        <el-button type="primary" @click="handleSearch">刷 新</el-button>
      </div>

      <el-table
          :data="tableData"
          v-loading="loading"
          style="width: 100%"
          class="custom-table"
          @expand-change="handleExpandChange"
          :row-key="(row) => `${row.target_type}_${row.target_id}`"
      >
        <el-table-column type="expand">
          <template #default="props">
            <div class="expand-detail">
              <h4 class="detail-title">详细举报记录</h4>
              <el-table
                  :data="expandData[`${props.row.target_type}_${props.row.target_id}`] || []"
                  v-loading="expandLoading[`${props.row.target_type}_${props.row.target_id}`]"
                  border
                  size="small"
                  class="inner-table"
              >
                <el-table-column prop="id" label="记录ID" width="80" />
                <el-table-column prop="user_id" label="举报人ID" width="100" />
                <el-table-column prop="reason" label="举报理由" min-width="180" />
                <el-table-column prop="create_time" label="举报时间" width="160">
                  <template #default="scope">{{ formatDate(scope.row.create_time) }}</template>
                </el-table-column>

                <el-table-column label="处理备注" min-width="150" show-overflow-tooltip>
                  <template #default="scope">
                    <span v-if="scope.row.process_remark" style="color: var(--book-hover-color)">
                      {{ scope.row.process_remark }}
                    </span>
                    <span v-else style="color: #999">-</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="目标类型" width="120">
          <template #default="scope">
            <el-tag :type="getTargetTypeColor(scope.row.target_type)" effect="light">
              {{ getTargetTypeName(scope.row.target_type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="target_id" label="目标ID" width="100" />

        <el-table-column label="内容预览" min-width="250" show-overflow-tooltip>
          <template #default="scope">
            <span class="preview-text">{{ scope.row.target_preview_text }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="report_count" label="被举报总数" width="120">
          <template #default="scope">
            <el-tag type="danger" effect="plain" round>
              {{ scope.row.report_count }} 次
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="最新举报时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.latest_report_time) }}
          </template>
        </el-table-column>

        <el-table-column label="工单处理" width="180" fixed="right">
          <template #default="scope">
            <template v-if="queryParams.status === 0">
              <el-button type="danger" link @click="handleProcess(scope.row, 1)">违规下架</el-button>
              <el-button type="info" link @click="handleProcess(scope.row, 2)">驳回</el-button>
            </template>
            <span v-else class="processed-tip">无需操作</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
            background
            layout="total, prev, pager, next, jumper"
            :total="total"
            v-model:current-page="queryParams.page"
            :page-size="queryParams.size"
            @current-change="handlePageChange"
        />
      </div>

    </el-card>
  </div>
</template>

<style scoped>
.reports-container { min-height: 100%; }

:deep(.admin-card) {
  background-color: var(--book-topbar-bg);
  border-color: var(--book-border-color);
  border-radius: 8px;
}

.search-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}
.status-select { width: 180px; }
.type-select { width: 150px; }

:deep(.custom-table) {
  --el-table-bg-color: var(--book-topbar-bg);
  --el-table-tr-bg-color: var(--book-topbar-bg);
  --el-table-header-bg-color: var(--book-bg-color);
  --el-table-text-color: var(--book-text-color);
  --el-table-header-text-color: var(--book-text-color);
  --el-table-border-color: var(--book-border-color);
  --el-table-row-hover-bg-color: var(--book-bg-color);
}

.preview-text {
  color: var(--book-text-color);
  font-family: monospace;
}

/* 展开区域样式设计 */
.expand-detail {
  padding: 16px 40px;
  background-color: var(--book-bg-color);
  border-radius: 4px;
}
.detail-title {
  margin: 0 0 12px 0;
  color: var(--book-hover-color);
  font-size: 14px;
}

/* 子表格特殊适配，使其与主表格融洽 */
:deep(.inner-table) {
  --el-table-bg-color: var(--book-bg-color);
  --el-table-tr-bg-color: var(--book-bg-color);
  --el-table-header-bg-color: var(--book-topbar-bg);
}

.processed-tip {
  color: var(--book-hover-color);
  font-size: 13px;
  user-select: none;
}

.pagination-wrapper { margin-top: 20px; display: flex; justify-content: center; }
:deep(.el-pagination.is-background .el-pager li:not(.is-active)) { background-color: var(--book-bg-color); color: var(--book-text-color); }
:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next) { background-color: var(--book-bg-color); color: var(--book-text-color); }
:deep(.el-pagination__total), :deep(.el-pagination__jump) { color: var(--book-text-color); }

/* Message Box 弹窗全局调整（不在 scoped 内生效，如果需要完美适配暗黑模式，推荐在 theme.css 全局修改 .el-message-box） */
</style>