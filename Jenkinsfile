pipeline {
    agent any

    environment {
        // --- EC2 Details ---
        EC2_USER = 'ubuntu'
        EC2_HOST = '35.172.48.105' // your EC2 Public IP or DNS
        PROJECT_DIR = '/home/ubuntu/online-chat-app'
        GIT_BRANCH = 'main'

        // --- SSH Key Path (on Jenkins Windows host) ---
        SSH_KEY_PATH = 'D:\\key\\chat.ppk'

        // --- Full path to PuTTY's plink.exe ---
        PLINK_PATH = 'C:\\Program Files\\PuTTY\\plink.exe'
    }

    triggers {
        // Auto trigger every git commit (or every minute fallback)
        pollSCM('* * * * *')
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📦 Pulling latest code from GitHub...'
                checkout scm
            }
        }

        stage('Deploy to EC2 via SSH') {
            steps {
                echo '🚀 Deploying app to EC2 via SSH...'

                bat """
                    echo Auto-caching EC2 host key (if not already cached)...
                    echo y | "${PLINK_PATH}" -i "${SSH_KEY_PATH}" ${EC2_USER}@${EC2_HOST} exit

                    echo Connecting and deploying to EC2...
                    "${PLINK_PATH}" -i "${SSH_KEY_PATH}" -batch ${EC2_USER}@${EC2_HOST} ^
                    "cd ${PROJECT_DIR} && git pull origin ${GIT_BRANCH} && bash scripts/run_on_ec2.sh"
                """
            }
        }
    }

    post {
        success {
            echo '✅ Deployment completed successfully on EC2!'
        }
        failure {
            echo '❌ Deployment failed — check Jenkins logs for details.'
        }
    }
}