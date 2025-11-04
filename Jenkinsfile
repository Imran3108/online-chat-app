pipeline {
    agent any

    environment {
        EC2_HOST = 'ec2-user@35.172.48.105'
        SSH_KEY_PATH = "C:/ProgramData/Jenkins/.jenkins/project.pem"  // Path to private key on Jenkins server
    }

    triggers {
        // Poll GitHub every 5 minutes for new commits
        pollSCM('H/5 * * * *')
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo 'Checking for new commits on GitHub...'
                git branch: 'main',
                    url: 'https://github.com/Imran3108/online-chat-app.git'
            }
        }

        stage('Deploy to AWS EC2') {
            steps {
                echo 'Deploying Online Chat App on AWS EC2...'

                sh '''
                    ssh -o StrictHostKeyChecking=no -i ${SSH_KEY_PATH} ${EC2_HOST} << 'EOF'
                        echo "Navigating to project directory..."
                        cd ~/online-chat-app

                        echo "Pulling latest code from Git..."
                        git pull

                        echo "Running deployment script..."
                        bash scripts/run_on_ec2.sh

                        echo "Deployment successful ✅"
                    EOF
                '''
            }
        }
    }

    post {
        success {
            echo '✅ AWS deployment completed successfully!'
        }
        failure {
            echo '❌ Deployment failed — check Jenkins logs for details.'
        }
    }
}
