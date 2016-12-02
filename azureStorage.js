'use strict'
const azure = require('azure')
const fs = require('fs')
const config = require('./server/init/configuration')
process.env['AZURE_STORAGE_CONNECTION_STRING'] = config.secure.azure.StorageConnectionString
const blobSvc = azure.createBlobService()

function checkParamterName (parameterName) {
  return new Promise(function (resolve, reject) {
    if (!parameterName) {
      console.warn('checkParameterName: parameterName not valid: ' + parameterName + '\n')
      reject('checkParameterName: parameterName not valid: ' + parameterName)
    } else {
      resolve(true)
    }
  })
}

function _createContainerInAzure (containerName) {
  return checkParamterName(containerName)
  .then(() => {
    return new Promise(function (resolve, reject) {
      blobSvc.createContainerIfNotExists(containerName, function (error, result, response) {
        if (error) {
          console.warn(error.message)
          reject(error)
        }

        if (result && result.created === true) {
          console.info(`Just created the ${containerName} container`)
          resolve(`Just created the ${containerName} container`)
        } else {
          console.info(`Container ${containerName} already exist`)
          resolve(`Container ${containerName} already exist`)
        }
      })
    })
  })
}

function _storeFiletoAzure (fileName, containerName) {
  return checkParamterName(fileName)
  .then(() => checkParamterName(containerName))
  .then(() => {
    return new Promise(function (resolve, reject) {
      blobSvc.createBlockBlobFromLocalFile(containerName, fileName, fileName, function (error, result, response) {
        if (error) {
          console.warn('storeFileToAzure', error)
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  })
}

function _storeTexttoFileAzure (fileName, containerName, txt) {
  return checkParamterName(fileName)
  .then(() => checkParamterName(containerName))
  .then(() => checkParamterName(txt))
  .then(() => {
    return new Promise(function (resolve, reject) {
      blobSvc.createAppendBlobFromText(containerName, fileName, txt, function (error, result, response) {
        if (!error) {
          resolve(result)
        } else {
          reject(error)
        }
      })
    })
  })
}

function _listFilesInAzure (containerName) {
  return checkParamterName(containerName)
  .then(() => {
    return new Promise(function (resolve, reject) {
      blobSvc.listBlobsSegmented(containerName, null, function (error, result, response) {
        if (!error) {
          let transLogListCsv = ''
          let transArrayText = JSON.stringify(result.entries)
          let transArray = JSON.parse(transArrayText)
          let counter = 0
          transArray.forEach(trans => { counter += 1; transLogListCsv = transLogListCsv + '[ ' + counter + ' ] ' + trans.name + '    ' + trans.lastModified + '\n' })
          if (transArray.length > 0) {
            console.log(transLogListCsv)
          } else {
            console.log('[]')
          }
          resolve({fileArray: transArray, fileList: transLogListCsv})
      // result.entries contains the entries
      // If not all blobs were returned, result.continuationToken has the continuation token.
        } else { // Error
          console.warn('listFileInAzure', error.statusCode)
          reject(error)
        }
      })
    })
  })
}


function _pruneFilesFromAzure (anArray, miliSecondDate, containerName) {
  anArray.forEach(fileObj => {
    let fileName = fileObj.name
    let timeIndexInFileName = 3 // enrollments.STUDENTS.LH221VVT161.1480532056928.csv
    let timeStamp = parseInt(fileName.split('.')[timeIndexInFileName])
    if (timeStamp <= miliSecondDate) {
      console.info('Deleteing file: ' + fileName + ' from Azure...')
      _delFileFromAzure(fileName, containerName)
    }
    return
  })
}

function _delFilesInAzureBeforeDate (date, containerName) {
  let thisDate = date.getTime()
  return checkParamterName(thisDate)
  .then(() => checkParamterName(containerName))
  .then(() => _listFilesInAzure(containerName))
  .then(msgObj => _pruneFilesFromAzure(msgObj.fileArray, thisDate, containerName))
}

function _getFileFromAzure (fileName, containerName, pathToStore) {
  return checkParamterName(fileName)
  .then(() => checkParamterName(containerName))
  .then(() => checkParamterName(pathToStore))
  .then(() => {
    let localFileName = pathToStore + fileName
    return new Promise(function (resolve, reject) {
      blobSvc.getBlobToStream(containerName, fileName, fs.createWriteStream(localFileName), function (error, result, response) {
        if (!error) {
          console.info('File: ' + fileName + 'Retrived from Azure and storeted to: ' + localFileName + '\n')
          resolve(localFileName)
        } else {
          reject(error)
        }
      })
    })
  })
}

function _getStreamFromAzure (fileName, containerName, localStream) {
  return checkParamterName(fileName)
  .then(() => checkParamterName(containerName))
  .then(() => checkParamterName(localStream))
  .then(() => {
    return new Promise(function (resolve, reject) {
      blobSvc.getBlobToStream(containerName, fileName, localStream, function (error, result, response) {
        if (!error) {
          console.info('Stream: ' + fileName + 'retrived from Azure....\n')
          resolve(result)
        } else {
          reject(error)
        }
      })
    })
  })
}

function _delFileFromAzure (fileName, containerName) {
  return checkParamterName(fileName)
  .then(() => checkParamterName(containerName))
  .then(() => {
    return new Promise(function (resolve, reject) {
      blobSvc.deleteBlob(containerName, fileName, function (error, response) {
        if (!error) {
          console.info('File: ' + fileName + ' Deleted from Azure....\n')
          resolve(fileName)
        } else {
          console.warn('Error: ', error)
          reject(error)
        }
      })
    })
  })
}

module.exports = {
  cloudStore: _storeFiletoAzure,
  cloudListFile: _listFilesInAzure,
  cloudgetFile: _getFileFromAzure,
  cloudgetStream: _getStreamFromAzure,
  cloudDelFile: _delFileFromAzure,
  cloudStoreTextToFile: _storeTexttoFileAzure,
  cloudDeleteFilesBeforeDate: _delFilesInAzureBeforeDate,
  cloudCreateContainer: _createContainerInAzure
}
