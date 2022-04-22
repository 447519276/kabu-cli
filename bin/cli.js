#! /usr/bin/env node

const program = require('commander')
const chalk = require('chalk')
const figlet = require('figlet')

program
    // 定义命令和参数
    .command('create <project-name>')
    .description('create a new project')
    // -f or --force 为强制创建，如果创建的目录存在则直接覆盖
    .option('-f,--force', 'overwrite target directory if it exist')
    .action((name, options) => {
        // 在create.js 中执行创建任务
        require('../lib/create')(name, options)
    })

program.version(`v${require('../package.json').version}`).usage('<command> [option]')

program
    // 监听 --help 执行
    .on('--help', () => {
        console.log(
            '\r\n' +
                chalk.red(
                    figlet.textSync('kabu', {
                        font: 'Isometric3',
                        horizontalLayout: 'default',
                        verticalLayout: 'default',
                        width: 80,
                        whitespaceBreak: true
                    })
                )
        )
        // 新增说明信息
        console.log(
            `\r\nRun ${chalk.cyan(`kabu <command> --help`)} for detailed usage of given command\r\n`
        )
    })

// 解析用户执行命令传入参数
program.parse(process.argv)
