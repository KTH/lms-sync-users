String cron_string = BRANCH_NAME == "master" ? "@midnight" : ""

pipeline {
    agent any

    triggers {
        cron(cron_string)
    }

    stages {
        stage('Cleanup') {
            steps {
                sh 'docker network prune -f'
            }
        }
        stage('Run Evolene') {
            environment {
                COMPOSE_PROJECT_NAME = "${env.BUILD_TAG}"

                CANVAS_API_KEY = credentials('CANVAS_API_TOKEN_1')
                CANVAS_API_URL = 'https://kth.test.instructure.com/api/v1'
                AZURE_SHARED_ACCESS_KEY = credentials('AZURE_SHARED_ACCESS_KEY')
                AZURE_SHARED_ACCESS_KEY_NAME = credentials('AZURE_SHARED_ACCESS_KEY_NAME')
                PROXY_PREFIX_PATH = '/app/lms-sync-users'
                CSV_DIR = '/tmp'
            }
            steps {
                sh 'ls $JENKINS_HOME/workspace/zermatt/jenkins/'
                sh '$JENKINS_HOME/workspace/zermatt/jenkins/buildinfo-to-node-module.sh /config/version.js'
                sh 'SLACK_CHANNELS="#team-e-larande-build,#pipeline-logs" DEBUG=True $EVOLENE_DIRECTORY/run.sh'
            }
        }
        stage('Dump info') {
            steps {
                sh 'docker images'
                sh 'docker network ls'
            }
        }
    }
}
