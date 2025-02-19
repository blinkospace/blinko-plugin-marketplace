# 对于 issue 创建事件
act workflow_dispatch -e .github/workflows/test-events/issue-opened.json

# 或者尝试
act push -e .github/workflows/test-events/issue-opened.json