import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    getInstallationOctokit,
} from '@/lib/github'

// Simplified cron test - no auth, just test the github import
export async function GET(request: NextRequest) {
    try {
        // Just check if we can import and access github functions
        const installations = await prisma.installation.findMany({
            where: { active: true },
            take: 1,
        })

        if (installations.length === 0) {
            return NextResponse.json({
                status: 'ok',
                message: 'No active installations to test',
            })
        }

        const installation = installations[0]

        // Try to get Octokit - this uses jsonwebtoken
        try {
            const octokit = await getInstallationOctokit(installation.installationId)
            return NextResponse.json({
                status: 'ok',
                message: 'GitHub Octokit created successfully',
                repo: installation.repoFullName,
            })
        } catch (githubError) {
            return NextResponse.json({
                status: 'github_error',
                error: githubError instanceof Error ? githubError.message : String(githubError),
            })
        }

    } catch (error) {
        return NextResponse.json({
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
        }, { status: 500 })
    }
}
