import axios from "axios";

export default class Telegram {
  constructor(token) {
    this.token = token
    this.baseApiUrl = 'https://api.telegram.org'
  }
  _request(_path, options = {}) {
    if (!this.token) {
      return Promise.reject(new errors.FatalError('Telegram Bot Token not provided!'));
    }
    options.method = 'post'
    options.url = this._buildURL(_path);
    return axios(options)
      .then(resp => {
        let data;
        try {
          data =  resp.data
        } catch (err) {
          throw new errors.ParseError(`Error parsing response: ${resp.data}`, resp);
        }
        if (data.ok) {
          return data.result;
        }
        throw new Error(`${data.error_code} ${data.description}`, resp);
      })
  }
  _buildURL(_path) {
    return `${this.baseApiUrl}/bot${this.token}/${_path}`;
  }
  sendMessage(chatId, text, data = {}) {
    data.chat_id = chatId;
    data.text = text;
    return this._request('sendMessage', { data });
  }
  sendPhoto(chatId, photo, data = {}) {
    data.chat_id = chatId;
    data.photo = photo;
    return this._request('sendPhoto', { data });
  }
  sendMultPhoto(chatId, photos, text, data = {}) {
    const media = photos.map((item, index) => {
      return {
        type: 'photo',
        media: item,
        caption: index === 0 ? text || '' : '',
        parse_mode: 'MarkdownV2'
      }
    })
    data.chat_id = chatId;
    data.media = media;
    return this._request('sendMediaGroup', { data });
  }
 }

// const test = new Telegram('1855341507:AAEjNsXsCBH2Mx8ks5qhc8JMUpS0EMPo4lQ')
// // test.sendMessage('@taiwanshashibot', 'hellow word')
// test.sendMultPhoto('@taiwanshashibot', [
//   'https://wx3.sinaimg.cn/large/006fcjhnly1grs86g1hu6j30gw0faq7n.jpg',
//   'https://wx4.sinaimg.cn/large/006fcjhnly1grs7jler06j30m80mcwiu.jpg'
// ], '测试')