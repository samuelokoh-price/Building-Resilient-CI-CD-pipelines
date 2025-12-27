pipeline {
  agent any

  stages {
    stage('Build Docker Image') {
      steps {
        sh 'docker build -t my-node-app:${BUILD_NUMBER} -t my-node-app:latest -f simple-nodejs-app-1/Dockerfile simple-nodejs-app-1'
      }
    }

    stage('Run Lint') {
      steps {
        sh 'docker run --rm my-node-app:${BUILD_NUMBER} npm run lint'
      }
    }

    stage('Run Tests') {
      steps {
        sh 'docker run --rm my-node-app:${BUILD_NUMBER} npm test'
      }
    }

    stage('Image Scan') {
      steps {
        sh '''
          docker run --rm \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v /var/lib/jenkins/Library/Caches/trivy:/root/.cache/ \
            -e TRIVY_DB_REPOSITORY=ghcr.io/aquasecurity/trivy-db \
            aquasec/trivy:latest image \
            --severity HIGH,CRITICAL \
            --exit-code 1 \
            --no-progress \
            --timeout 10m \
            --format table \
            --output trivy-report-${BUILD_NUMBER}.txt \
            my-node-app:${BUILD_NUMBER}
        '''
        archiveArtifacts artifacts: "trivy-report-${BUILD_NUMBER}.txt", fingerprint: true
      }
    }

    stage('Package Artifact') {
      steps {
        sh 'docker save my-node-app:${BUILD_NUMBER} | gzip > my-node-app-${BUILD_NUMBER}.tar.gz'
        archiveArtifacts artifacts: "my-node-app-${BUILD_NUMBER}.tar.gz", fingerprint: true
      }
    }

    stage('Use Artifact') {
      steps {
        sh "gunzip -c my-node-app-${BUILD_NUMBER}.tar.gz | docker load"
        sh "docker run -d --rm -p 3000:3000 --name app my-node-app:${BUILD_NUMBER}"
      }
    }
  }
}
