pipeline {
  agent any

  stages {
    stage('Build Docker Image') {
      environment { DOCKER_BUILDKIT = '1' }
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
          trivy image \
            --severity HIGH,CRITICAL \
            --no-progress \
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
        // Run the container temporarily
        sh """
          docker rm -f app || true
          docker run -d --name app -p 3000:3000 my-node-app:${BUILD_NUMBER}
          sleep 5
          curl -f http://localhost:3000 || (docker logs app && exit 1)
          docker rm -f app
        """
      }
    }


    stage('Deploy') {
      when {
        branch 'main'
      }
      steps {
        sh '''
          echo "Deploying build ${BUILD_NUMBER} from main..."
          # Your deploy commands go here, e.g.:
          # docker login ...
          # docker push my-node-app:${BUILD_NUMBER}
          # kubectl apply -f k8s/
        '''
      }
    }

  }
}
