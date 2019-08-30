## Welcome to GitHub Pages

You can use the [editor on GitHub](https://github.com/wuhaomin/wuhaomin.github.io/edit/master/index.md) to maintain and preview the content for your website in Markdown files.

Whenever you commit to this repository, GitHub Pages will run [Jekyll](https://jekyllrb.com/) to rebuild the pages in your site, from the content in your Markdown files.

### Markdown

Markdown is a lightweight and easy-to-use syntax for styling your writing. It includes conventions for

```markdown
Syntax highlighted code block

# Header 1
## Header 2
### Header 3

- Bulleted
- List

1. Numbered
2. List

**Bold** and _Italic_ and `Code` text

[Link](url) and ![Image](src)
```

For more details see [GitHub Flavored Markdown](https://guides.github.com/features/mastering-markdown/).


## React

 - react
  
  - [demo连接](https://github.com/wuhaomin/wuhaomin.github.io/blob/master/react/note.md)
 
 - react-router
 
 - react-redux
 

## es6


## css



### Jekyll Themes

Your Pages site will use the layout and styles from the Jekyll theme you have selected in your [repository settings](https://github.com/wuhaomin/wuhaomin.github.io/settings). The name of this theme is saved in the Jekyll `_config.yml` configuration file.

### Support or Contact

Having trouble with Pages? Check out our [documentation](https://help.github.com/categories/github-pages-basics/) or [contact support](https://github.com/contact) and we’ll help you sort it out.


```javascript
import mqtt from 'mqtt';
class Mqtt {
  constructor() {
    this.client = null; // mqtt连接实例
    this.options = {}; // 连接mqtt配置选项
    // 监听事件，用于处理非publish返回
    // 需要先添加监听 mqtt.on(method, callback)
    // listeners: {method: [Function]}
    this.listeners = {};
    // 序列号，用于处理publish返回
    // sequences: { [seq]: {resolve, reject, expire} }
    this.sequences = {};
    // 发布超时, 默认不处理
    // this.timeout = 6 * 1000; // 毫秒
  }

  /**
   * 添加被动接受消息，事件队列
   * @param {String} key - 关键字
   * @param {Function} callback - 回调函数
   */
  on(key, callback) {
    if (this.listeners[key]) {
      this.listeners[key].push(callback);
    } else {
      this.listeners[key] = [callback];
    }
  }

  /**
   * 移除被动接受消息，事件队列
   * @param {String} key - 关键字
   * @param {Function} callback - 回调函数
   */
  off(key, callback) {
    if (Object.prototype.toString.call(callback) === '[object Function]') {
      const callbacks = this.listeners[key] || [];
      this.listeners[key] = callbacks.filter(cb => cb !== callback); // 移除某一个回调
    } else {
      delete this.listeners[key]; // 移除全部回调
    }
  }

  /**
   * MQTT连接
   * @param {*} url - MQTT服务器地址
   * @param {*} options - 选项
   * @param {*} connectCallback - 连接成功回调
   * @param {*} errorCallback - 错误回调（互踢）
   * @returns {undefined}
   */
  connect(url, options = {}, connectCallback, errorCallback) {
    this.options = options;
    // 连接 MQTT
    logger.info('[MQTT] [call] [connect]', 'url:', url, 'options:', options);

    this.client = mqtt.connect(url, options);

    // 连接成功，调用此事件
    this.client.on('connect', connack => {
      logger.info('[MQTT] [event] [connect]', 'connack:', connack);
      connectCallback(connack);
    });
    // 重连，调用此事件
    this.client.on('reconnect', () => {
      // logger.info('[MQTT] [event] [reconnect]');
    });
    this.client.on('close', () => {
      logger.info('[MQTT] [event] [close]');
    });
    this.client.on('disconnect', packet => {
      logger.info('[MQTT] [event] [disconnect]', 'packet:', packet);
    });
    this.client.on('offline', () => {
      logger.info('[MQTT] [event] [offline]');
    });
    this.client.on('error', error => {
      logger.error('[MQTT] [event] [error]', 'error:', error);
      errorCallback(error);
      this.client.end();
    });
    this.client.on('end', () => {
      logger.info('[MQTT] [event] [end]');
    });
    // 所有订阅消息，都会调用此事件（我们是模糊订阅）
    this.client.on('message', (topic, message, packet) => {
      // 1. Buffer --> Object
      const _message = JSON.parse(String(message)); // ArrayBuffer
      // 2. 日志
      logger.info('[MQTT] [event] [<--]', 'topic:', topic, 'message:', _message, 'packet:', packet);
      // 3. 处理resolve||reject返回（publish）
      const { seq } = _message;
      const sequence = this.sequences[seq];
      if (sequence) {
        const { resolve, reject, expire } = sequence;
        delete this.sequences[seq];
        if (Date.now() < expire) {
          resolve(_message);
        } else {
          reject('[MQTT] publish timeout');
        }
        return;
      }
      // 4. 处理lister返回（listener/on）
      const method = topic.split('/').pop();
      (this.listeners[method] || []).forEach(listener => {
        listener(_message);
      });
    });
    // 所有发布消息，都会调用此事件
    this.client.on('packetsend', packet => {
      logger.log('[MQTT] [event] [packetsend]', `packet:`, packet);
    });
    // 所有接收消息，都会调用此事件
    this.client.on('packetreceive', packet => {
      logger.log('[MQTT] [event] [packetreceive]', `packet:`, packet);
    });
    return this.client;
  }

  /**
   * 发布消息
   * @param {String} topic - 发布主题
   * @param {Object} message - 发布消息
   * @param {Object} options - 发布选项 {qos, retain, dup, properties, cbStorePut}
   * @param {Number} options.qos - QoS级别，默认0
   * @param {Boolean} options.retain - 保留标志，默认false
   * @param {Boolean} options.dup - 是否重复标志，默认false
   * @param {Object} options.properties - MQTT 5.0
   * @param {Function} options.cbStorePut - 如果QoS为1或2，则在将消息放入outgoingStore时触发。
   * @param {Function} callback - function(err), 回调会在QoS处理完成或在下次处理前发生（QoS为0时）. An error occurs if client is disconnecting.
   * @param {Number} timeout - 超时，毫秒，默认不做超时处理
   * @returns {Promise}
   */
  publish({ topic, message, options = { qos: 1, retain: false, dup: false } }, timeout) {
    // iot/v1/c/[deviceId]/xxx  (用于发送给设备消息)
    // iot/v1/s/[userId]/xxx  (用于发送给云端消息)
    // iot/v1/cb/[userId]/xxx  (用于APP广播消息)
    const { username, clientId } = this.options;
    const seq = getSeq();
    message.clientId = clientId;
    message.seq = seq;
    message.srcAddr = `0.${username}`;
    logger.info('[MQTT] [call] [-->]', 'topic:', topic, 'message:', message);
    if (this.client === null) {
      return Promise.reject('[MQTT] [call] [-->] client is null.');
    }
    return new Promise((resolve, reject) => {
      // 1. 回调处理
      const callback = error => {
        if (error) {
          reject(error);
        }
      };
      // 2. 序列列处理  注意：真实resolve和reject在message事件里面处理
      this.sequences[seq] = {
        resolve,
        reject,
        expire: Date.now() + (timeout || Date.now()), // 毫秒
      };
      // 3. 真正发布
      this.client.publish(topic, JSON.stringify(message), options, callback);
    });
  }

  /**
   * 订阅消息
   * @param {String|Array|Object} topic - 订阅主题（+ for single level， # for multi level）
   * @param {Object} options - 订阅选项 {qos, nl, rap, rh, properties}
   * @param {Number} options.qos - QoS级别，默认0
   * @param {Boolean} options.nl - No Local MQTT 5.0 flag
   * @param {Boolean} options.rap - Retain as Published MQTT 5.0 flag
   * @param {*} options.rh - Retain Handling MQTT 5.0
   * @param {Object} options.properties - 属性
   * @param {Number} options.properties.subscriptionIdentifier - 表示订阅的标识符
   * @param {Object} options.properties.userProperties - 用户属性，键值对
   * @param {Function} callback - function (err, granted) 订阅确认触发回调
   * @param {*} callback.err - 订阅错误或client断开连接时发生的错误
   * @param {Object[]} callback.granted - [{topic, qos}]
   * @param {String} callback.granted.topic - 订阅主题
   * @param {Number} callback.granted.qos - qos是被授予的qos级别
   * @param {Function} callback - function(err), fired when the QoS handling completes, or at the next tick if QoS 0. An error occurs if client is disconnecting.
   * @returns {Promise}
   */
  subscribe({ topic, options = { qos: 1 } }) {
    // iot/v1/c/[userId]/# （用于接收云端和设备发给APP的消息）
    // iot/v1/cb/[deviceId]/#  (用于接收设备的广播)
    logger.info('[MQTT] [call] [subscribe]', 'topic:', topic);
    if (this.client === null) {
      return Promise.reject('[MQTT] [call] [subscribe] client is null.');
    }
    return new Promise((resolve, reject) => {
      const callback = (error, granted) => {
        if (error) {
          reject(error);
        } else {
          resolve(granted);
        }
      };
      this.client.subscribe(topic, options, callback);
    });
  }

  /**
   * 取消订阅
   * @param {String|Array} topic - 订阅主题
   * @param {Object} options - 取消订阅选项
   * @param {Object} options.properties - 属性
   * @param {Object} options.properties.userProperties - 用户属性，键值对
   * @param {Function} callback - function (err) 取消订阅确认触发回调，如果client断开连接会发生一个错误
   * @returns {undefined}
   */
  unsubscribe({ topic, options = {} }) {
    logger.info('[MQTT] [call] [unsubscribe]', 'topic:', topic);
    return new Promise((resolve, reject) => {
      const callback = (error, result) => {
        return error ? reject(error) : resolve(result);
      };
      this.client.unsubscribe(topic, options, callback);
    });
  }

  /**
   * 关闭连接
   * @param {Boolean} force - 如果设置为true，立即关闭client，不会等待已发送消息回复确认，这个参数是可选的。
   * @param {Object} options - 断开连接选项
   * @param {Number} options.reasonCode - 断开连接原因码
   * @param {Object} options.properties - 属性
   * @param {Number} options.properties.sessionExpiryInterval - 表示会话过期间隔(以秒为单位)
   * @param {String} options.properties.reasonString - 表示断开连接的原因
   * @param {Object} options.properties.userProperties - 用户属性，键值对
   * @param {String} options.properties.serverReference - 客户端可以使用该字符串标识要使用的其它服务器
   * @param {Function} cb - function () 将在客户端关闭时调用。这个参数是可选的
   */
  end({ force = false, options, cb = () => {} }) {
    logger.info('[MQTT] [call] [end]', 'force:', force);
    this.client.end(force, options, cb);
  }

  /**
   * 从outgoingStore中删除一条消息。如果消息被删除，将调用带错误的传出回调(“Message remove”)。
   * @param {*} mid - outgoingStore中消息的messageId
   */
  removeOutgoingMessage(mid) {
    logger.info('[MQTT] [call] [removeOutgoingMessage]', 'mid:', mid);
    this.client.removeOutgoingMessage(mid);
  }

  /**
   * 使用与Connect()相同的选项再次连接
   */
  reconnect() {
    logger.info('[MQTT] [call] [reconnect]');
    this.client.reconnect();
  }

  /**
   * Handle messages with backpressure support, one at a time. Override at will, but always call callback, or the client will hang.
   * @param {Object} packet
   * @param {Function} callback
   */
  handleMessage({ packet, callback = () => {} }) {
    logger.info('[MQTT] [call] [handleMessage]', 'packet:', packet);
    this.client.handleMessage(packet, callback);
  }

  /**
   * 如果client是连接，则将其设置为true。否则false。
   */
  get connected() {
    return this.client.connected;
  }

  /**
   * 获取最后一个消息id。这仅适用于已发送的消息。
   */
  getLastMessageId() {
    logger.info('[MQTT] [call] [getLastMessageId]');
    return this.client.getLastMessageId();
  }

  /**
   * 如果client试图重新连接到服务器，则将其设置为true。否则false。
   */
  get reconnecting() {
    return this.client.reconnecting;
  }
}

export default Mqtt;

```
