const { getRepoList, getTagList } = require('./http')
const ora = require('ora')
const inquirer = require('inquirer')
const chalk = require('chalk')

const path = require('path')
// 用promisify方法对不支持promise进行promise化
const util = require('util')
// download-git-repo不支持promise
const downloadGitRepo = require('download-git-repo')
const spawn = require('cross-spawn')

// 添加加载动画
async function wrapLoading(fn, message, ...args) {
    // 使用 ora 初始化，传入提示消息message
    const spinner = ora(message)
    // 开始加载动画
    spinner.start()

    try {
        // 执行传入方法 fn
        const result = await fn(...args)
        // 状态修改为成功
        spinner.succeed()
        return result
    } catch (error) {
        // 状态修改为失败
        console.log(error)
        spinner.fail('Request failed, refetch ...')
    }
}

class Generator {
    constructor(name, targetDir) {
        // 目录名称
        this.name = name
        // 创建位置
        this.targetDir = targetDir
        // 对 download-git-repo 进行 promise 化改造
        this.downloadGitRepo = util.promisify(downloadGitRepo)
    }

    // 获取用户选择的模板
    // 1) 从远程拉取模板
    // 2) 用户选择自己新下载的模板名称
    // 3) return 用户选择的名称
    async getRepo() {
        // 1) 从远程拉取模板数据
        const repoList = await wrapLoading(getRepoList, 'waiting fetch template')

        if (!repoList) return

        // 过滤我们需要的模板名称
        const repos = repoList.map((item) => {
            return item.name
        })

        // 2) 用户选择自己新下载的模板名称
        const { repo } = await inquirer.prompt({
            name: 'repo',
            type: 'list',
            choices: repos,
            message: 'Please choose a template to create project'
        })

        // 3) return 用户选择的名称
        return repo
    }

    // 获取用户选择的版本
    // 1) 基于 repo 结果，远程拉取对应的 tag 列表
    // 2) 用户选择自己需要下载的 tag
    // 3) return 用户选择的 tag
    async getTag(repo) {
        // 1) 基于repo结果，远程拉取对应的tag列表
        const tags = await wrapLoading(getTagList, 'waiting fetch tag', repo)
        if (!tags) return

        // 过滤我们需要的tag名称
        const tagsList = tags.map((item) => item.name)

        // 2) 用户选择自己需要下载的tag
        const { tag } = await inquirer.prompt({
            name: 'tag',
            type: 'list',
            choices: tagsList,
            message: 'Please choose a tag to create project'
        })

        // 3) return 用户选择的tag
        return tag
    }

    // 下载远程模板
    // 1) 拼接下载地址
    // 2) 调用下载方法
    async download(repo, tag) {
        // 1) 拼接下载地址
        // const requestUrl = `zhurong-cli/${repo}${tag ? '#' + tag : ''}`
        const requestUrl = `KabuCliTemplates/${repo}${tag ? '#' + tag : ''}`

        // 2)调用下载方法
        await wrapLoading(
            this.downloadGitRepo, //远程下载方法
            'waiting download template', //加载提示信息
            requestUrl, //参数1：下载地址
            path.resolve(process.cwd(), this.targetDir) // 参数2：创建位置
        )
    }

    // 安装模板依赖
    installDep(fn) {
        const installDependencies = spawn('npm', ['install'], {
            cwd: path.resolve(process.cwd(), this.targetDir),
            stdio: 'inherit'
        })

        installDependencies.on('close', (code) => {
            if (code !== 0) {
                console.log(chalk.red('Error occurred while installing dependencies!'))
                process.exit(1)
            } else {
                // 执行成功
                console.log(chalk.cyan('Dependencies Install finished'))
                fn()
            }
        })
    }
    // 核心创建逻辑
    // 1)获取模板名称
    // 2)获取 tag 名称
    // 3)下载模板到模板目录
    // 4)安装模板依赖
    async create() {
        // 1) 获取模板名称
        const repo = await this.getRepo()

        // 2) 获取 tag 名称
        const tag = await this.getTag(repo)

        // 3) 下载模板到模板目录
        await this.download(repo, tag)

        // 4) 安装模板依赖
        await this.installDep(() => {
            console.log(`\r\nSuccessfully created project ${chalk.cyan(this.name)}`)
            console.log(`\r\n  cd ${chalk.cyan(this.name)}`)
            console.log('yarn serve\r\n')
        })
    }
}

module.exports = Generator
