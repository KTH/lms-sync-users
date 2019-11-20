pipeline {
    agent any

    stages {
        // Some example code for creating a new process!
        /*stage('Test') {
            environment {
                HOME = '.'
            }
            agent {
                docker { image 'node:10-alpine' }
            }
            steps {
                withCredentials([string(credentialsId: 'CANVAS_API_TOKEN_PROVISIONAL', variable: 'CANVAS_API_KEY')]){
                    echo "My test HOME: '${HOME}'"
                    sh 'npm run test:docker-unit'
                    sh 'npm run test:docker-integration'
                }
            }
        }*/

        // These are the commands run in the original Jenkins project
        stage('Original Process') {
            steps {
                withCredentials([
                        string(credentialsId: 'CANVAS_API_TOKEN_2', variable: 'CANVAS_API_KEY'),
                        string(credentialsId: 'CANVAS_API_URL', variable: 'CANVAS_API_URL'),
                        string(credentialsId: 'AZURE_SHARED_ACCESS_KEY', variable: 'AZURE_SHARED_ACCESS_KEY'),
                        string(credentialsId: 'AZURE_SHARED_ACCESS_KEY_NAME', variable: 'AZURE_SHARED_ACCESS_KEY_NAME'),
                        string(credentialsId: 'PROXY_PREFIX_PATH', variable: 'PROXY_PREFIX_PATH'),
                        string(credentialsId: 'CSV_DIR', variable: 'CSV_DIR'),
                        string(credentialsId: 'LOG_LEVEL', variable: 'LOG_LEVEL'),
                        string(credentialsId: 'LOG_SRC', variable: 'LOG_SRC')
                ]){
                    sh 'ls $JENKINS_HOME/workspace/zermatt/jenkins/'
                    sh '$JENKINS_HOME/workspace/zermatt/jenkins/buildinfo-to-node-module.sh /config/version.js'
                    sh 'SLACK_CHANNELS="#team-e-larande-build,#pipeline-logs" DEBUG=True EXPERIMENTAL=True $EVOLENE_DIRECTORY/run.sh'
                    sh 'docker images'
                }
            }
        }
    }

    // Some more example code which can be extended in the future...
    /*post {
        success {
            echo "SUCCESS!"
        }
    }*/
}
