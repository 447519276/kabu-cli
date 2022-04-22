// 通过 axios 处理请求
const axios = require('axios')

axios.interceptors.response.use((res) => {
    return res.data
})

// 获取模板列表
async function getRepoList() {
    return axios.get('https://api.github.com/orgs/KabuCliTemplates/repos')
}

// 获取版本信息
async function getTagList(repo) {
    return axios.get(`https://api.github.com/repos/KabuCliTemplates/${repo}/tags`)
}

module.exports = {
    getRepoList,
    getTagList
}
