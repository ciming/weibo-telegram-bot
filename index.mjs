import TelegramBot from './telegram.mjs'
import store from 'data-store'
import axios from 'axios'
import cheerio from 'cheerio'
import schedule from 'node-schedule'
import config from 'config'

const telegramConfig = config.get('telegram')

const TOKEN = telegramConfig.TOKEN

class Weibo {
  constructor() {
    this.weibo = config.get('weibo.url')
    this.bot = new TelegramBot(TOKEN)
    this.store = store({path: process.cwd() + '/data.json'})
  }
  async sendMessage(weibo) {
    
    if(weibo.pics.length === 0) {
      await this.bot.sendMessage(telegramConfig.group, weibo.title, {
        parse_mode: 'MarkdownV2'
      })
    } else if (weibo.pics.length === 1) {
      await this.bot.sendPhoto(telegramConfig.group, weibo.pics[0], {
        caption: weibo.title,
        parse_mode: 'MarkdownV2'
      })
    } else if(weibo.pics.length > 1) {
      await this.bot.sendMultPhoto(telegramConfig.group, weibo.pics, weibo.title)
    }
    return true
  }
  _formatMessage(message) {
    const $ = cheerio.load(message)
    $('a').each((index, item) => {
      const linkElem = $(item)
      const href = linkElem.attr('href')
      const text = linkElem.text()
      linkElem.replaceWith(`[${text}](${href})`)
    })
    return $.text().replace(/#(.*)#/g, '「 $1 」').replace('.', '\.')
  }
  async run() {
    let prevTime = this.store.get('time')
    // let prevTime = 'Wed Jun 24 2021 09:10:36 GMT+0800 (China Standard Time)'
    let prevDate = prevTime ? new Date(prevTime) : new Date()
    
    try{
      const {data} = await axios.get(this.weibo)
      const weiboItems = data.data.cards.filter(item => item.card_type === 9 && new Date(item.mblog.created_at) > prevDate )
      for (let item of weiboItems) {
        const weibo = {}
        weibo.title = this._formatMessage(item.mblog.text)
        weibo.pics = item.mblog.pic_num > 0 ? item.mblog.pics.map(item => item.large.url) : []
        const retweeted_status = item.mblog.retweeted_status
        if(retweeted_status) {
          weibo.pics = retweeted_status.pic_num > 0 ? retweeted_status.pics.map(item => item.large.url) : []
        }
        try {
          await this.sendMessage(weibo);
        } catch (error) {
          console.log(error);
        }
        
      }
    }catch(error) {
      console.error(error)
    }
    const now = new Date().toString()
    this.store.set('time', now);
  }
}

const weibo = new Weibo()

let rule = new schedule.RecurrenceRule();
const minutes = []
for(let i = 0; i <= 58; i+=2 ) {
  minutes.push(i)
}
rule.minute = minutes;
const job = schedule.scheduleJob(rule, function(){
  weibo.run()
});