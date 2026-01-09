# AI-Powered Job Application Assistant (AWS + Next.js + Amplify)

This repository contains **one of the early base versions** of my AI-powered job application assistant, built with **Next.js (App Router)**, **Node.js**, and **AWS Amplify Gen 2**.  
The app helps job seekers **tailor resumes** using AI, integrating a wide range of AWS services (Lambda, S3, SNS/SQS, Bedrock, AppSync, App Runner, CloudFront, ECS Fargate Spot, etc.).

---

## ⚠️ Important

- This is **not** the production version of the application.  
- The production version is still evolving, but its **AWS backend and core features are fully live and operating reliably**.

---

## 🧩 Environment Variables

To run this early version locally, you must fill in the variables inside:

.env.development


This file is included **only as a template**.  
It will **not work** unless you replace its values with your own configuration, including:

- Your AWS Amplify environment details  
- Your AWS region  
- Your S3 bucket names  
- API endpoints (AppSync, Lambda, internal APIs)  
- Your domain or local dev URLs  
- Any secrets required by your AWS setup  

The current `.env.development` is empty or incomplete and must be populated with **your own AWS and web configuration**.

---

# 🛠️ Tech Stack

## **Frontend & Full-Stack**
- Next.js (App Router, TypeScript)  
- Node.js (runtime for development and server functions)  
- React Server Components  
- TailwindCSS  
- Docker (containerised deployments)

## **AWS Cloud Stack**
- AWS Amplify (Gen 2)  
- AWS Lambda  
- SNS / SQS  
- Amazon S3  
- AWS CloudFront  
- Route 53  
- AWS CDK  
- Amazon ECR  
- AWS App Runner
- Amazon ECS Fargate & Fargate Spot — serverless container compute, with Spot used for cost-efficient workloads
- AWS CloudWatch  
- AWS Bedrock  
- AWS SDK  
- Lambda Layers  
- IAM

## **Languages**
- TypeScript  
- Python  
- Node.js (server-side logic and tooling)

---

# 🚀 Key Features & Architecture

- Serverless, event-driven backend using **Lambda, SNS, SQS, and S3 events**  
- Generative AI capabilities via **AWS Bedrock** for automated content generation  
- **Lambda Layer** included for image processing and performance optimization  
- Dockerised full-stack application deployed on **AWS App Runner** with autoscaling, plus **ECS Fargate Spot** for cost-optimized container workloads  
- Custom domain routing configured using **Route 53**  
- Static assets delivered globally via **CloudFront + S3**  
- REST-style API layer using **AWS Amplify Data**, integrated with auth and storage  
- **Infrastructure-as-Code** using AWS CDK for reproducible deployments  
- CloudWatch monitoring for logs, metrics, and observability  
- Modern full-stack architecture built on **Node.js + Next.js**

---

# 📌 About This Repository

This repo provides **one of the first functional base versions** of the project.

- The actual production system is more advanced, and significantly improved.  
- Some architectural components here differ from the live version.  
- This repository is shared for:

  - ✅ Learning  
  - ✅ Technical reference  
  - ✅ Demonstration of early architecture  
  - ✅ Educational purposes  

---

# 📄 License

This repository is shared for **educational and demonstration purposes only**.  
**All rights reserved.**  

