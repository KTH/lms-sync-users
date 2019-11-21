pipeline {
    agent any

    stages {
        stage('Cleanup') {
            steps {
                sh 'docker network prune -f'
            }
        }
        stage('Run Evolene') {
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
                }
            }
        }
        stage('Dump info') {
            sh 'docker images'
            sh 'docker network ls'
        }
    }
}
