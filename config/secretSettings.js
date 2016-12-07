'use strict'

const getEnv = require('kth-node-configuration').getEnv

/**
 * This configuration file holds all secret information that is used in the local environment.
 * This file is ignored by git.
 */

/**
 * This is the template for the configuration file that holds
 * all secret information that is used in the local environment.
 * This file is checked in to git, but the localSettings.js file each developer
 * should create based on this template is not.
 */

module.exports = {
  secure: {
    ldap: {
      client: {
        url: getEnv('LDAP_URI', 'ldaps://ldap.ug.kth.se'),
        timeout: 300000,
        connectTimeout: 3000,
        maxConnections: 10,
        idleTimeout: 300000,
        checkInterval: 10000,
        'reconnect': true
      },
      bind: {
        // username: 'system.canvas@ug.kth.se',
        // password: ''
        username: getEnv('LDAP_USERNAME', 'system.canvas@ug.kth.se'),
        password: getEnv('LDAP_PASSWORD')
      },
      base: getEnv('LDAP_BASE', 'OU=UG,DC=ug,DC=kth,DC=se')
    },
    canvas: {
      apiKey: getEnv('CANVAS_API_KEY')
    },
    azure: {
      queueConnectionString: getEnv('AZURE_QUEUE_CONNECTION_STRING', 'Endpoint=sb://kth-integral.servicebus.windows.net/;SharedAccessKeyName=canvas-consumer;SharedAccessKey='),
      queueName: getEnv('AZURE_QUEUE_NAME')
    }
  }
}
