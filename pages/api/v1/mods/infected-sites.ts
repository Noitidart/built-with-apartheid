import { requireMod } from '@/lib/auth.middleware';
import { withPrisma } from '@/lib/prisma';
import type { PrismaClient } from '@prisma/client';
import { sub } from 'date-fns';
import type { NextApiRequest, NextApiResponse } from 'next';

export type TInfectedSite = {
  id: number;
  hostname: string;
  isMasjid: boolean;
  firstDetected: Date;
  recentActivity: number;
  postsCount: number;
  totalViews: number;
  uniqueViews: number;
  activityTrend: 'increasing' | 'decreasing' | 'stable';
  detectedCompanies: string[];
  watcherCount: number;
};

export type TGetInfectedSitesResponseData = {
  stats: {
    totalInfectedSites: number;
    infectedMasjids: number;
    recentActivity: number;
    sitesWithWatchers: number;
  };
  infectedSites: TInfectedSite[];
};

const getInfectedSitesHandler = withPrisma(
  requireMod(async function getInfectedSitesHandler(
    prisma: PrismaClient,
    req: NextApiRequest,
    res: NextApiResponse
  ) {
    if (req.method !== 'GET') {
      return res.status(405).json({
        _errors: {
          formErrors: ['requestErrors.methodNotAllowed'],
          fieldErrors: {}
        }
      });
    }

    // Parse query parameters
    const showMasjidsOnly = req.query.showMasjidsOnly === 'true';
    const sortBy = (req.query.sortBy as string) || 'activity-high';
    const timeRange = (req.query.timeRange as string) || '24h';

    // Calculate date range based on timeRange parameter
    let activityStartDate: Date | undefined;
    if (timeRange !== 'all') {
      switch (timeRange) {
        case '24h':
          activityStartDate = sub(new Date(), { hours: 24 });
          break;
        case '7d':
          activityStartDate = sub(new Date(), { days: 7 });
          break;
        case '1m':
          activityStartDate = sub(new Date(), { months: 1 });
          break;
      }
    }

    // Get websites with their latest scan data
    const websitesWithScans = await prisma.website.findMany({
      where: {
        ...(showMasjidsOnly && { isMasjid: true }),
        scans: {
          some: {
            changes: {
              not: {}
            }
          }
        }
      },
      select: {
        id: true,
        hostname: true,
        isMasjid: true,
        createdAt: true,
        watchers: {
          select: {
            id: true
          }
        },
        scans: {
          where: {
            changes: {
              not: {}
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          select: {
            changes: true,
            createdAt: true
          }
        },
        interactions: {
          where: activityStartDate ? {
            createdAt: {
              gte: activityStartDate
            }
          } : undefined,
          select: {
            id: true,
            type: true,
            createdAt: true,
            userId: true
          }
        }
      }
    });

    // Process websites to extract infected sites data
    const infectedSites: TInfectedSite[] = websitesWithScans
      .filter((website) => {
        // Filter sites that currently have detected companies
        const latestScan = website.scans[0];
        if (!latestScan) return false;
        
        const currentlyDetected = Object.entries(latestScan.changes)
          .filter(([_, status]) => status === 'new' || status === 'still-present')
          .map(([companyId]) => companyId);
        
        return currentlyDetected.length > 0;
      })
      .map((website) => {
        const latestScan = website.scans[0];
        const currentlyDetected = Object.entries(latestScan.changes)
          .filter(([_, status]) => status === 'new' || status === 'still-present')
          .map(([companyId]) => companyId);

        // Separate activity and views
        const nonViewInteractions = website.interactions.filter(i => i.type !== 'VIEW');
        const viewInteractions = website.interactions.filter(i => i.type === 'VIEW');
        const postInteractions = website.interactions.filter(i => i.type === 'POST');
        
        // Calculate activity based on selected time range (excluding views)
        const recentActivity = nonViewInteractions.length;
        
        // Calculate posts count
        const postsCount = postInteractions.length;
        
        // Calculate total views
        const totalViews = viewInteractions.length;
        
        // Calculate unique views (unique users who viewed)
        const uniqueViewerIds = new Set(
          viewInteractions
            .filter(i => i.userId)
            .map(i => i.userId)
        );
        const uniqueViews = uniqueViewerIds.size;

        // Calculate activity trend
        // For trend calculation, we'll compare recent vs older activity
        let activityTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
        
        if (timeRange !== 'all' && activityStartDate) {
          // Get midpoint of the time range for trend comparison
          const midpointDate = new Date(
            (activityStartDate.getTime() + new Date().getTime()) / 2
          );
          
          const firstHalfActivity = nonViewInteractions.filter(
            (i) => i.createdAt >= activityStartDate && i.createdAt < midpointDate
          ).length;
          
          const secondHalfActivity = nonViewInteractions.filter(
            (i) => i.createdAt >= midpointDate
          ).length;
          
          if (secondHalfActivity > firstHalfActivity * 1.5) {
            activityTrend = 'increasing';
          } else if (secondHalfActivity < firstHalfActivity * 0.5) {
            activityTrend = 'decreasing';
          }
        }

        return {
          id: website.id,
          hostname: website.hostname,
          isMasjid: website.isMasjid,
          firstDetected: latestScan.createdAt,
          recentActivity,
          postsCount,
          totalViews,
          uniqueViews,
          activityTrend,
          detectedCompanies: currentlyDetected,
          watcherCount: website.watchers.length
        };
      });

    // Sort based on sortBy parameter
    infectedSites.sort((a, b) => {
      switch (sortBy) {
        case 'activity-low':
          return a.recentActivity - b.recentActivity;
        case 'activity-high':
          return b.recentActivity - a.recentActivity;
        case 'posts-low':
          return a.postsCount - b.postsCount;
        case 'posts-high':
          return b.postsCount - a.postsCount;
        case 'views-low':
          return a.totalViews - b.totalViews;
        case 'views-high':
          return b.totalViews - a.totalViews;
        case 'viewers-low':
          return a.uniqueViews - b.uniqueViews;
        case 'viewers-high':
          return b.uniqueViews - a.uniqueViews;
        case 'recent':
          return b.firstDetected.getTime() - a.firstDetected.getTime();
        case 'oldest':
          return a.firstDetected.getTime() - b.firstDetected.getTime();
        case 'watchers':
          return b.watcherCount - a.watcherCount;
        default:
          return b.recentActivity - a.recentActivity;
      }
    });

    // Calculate stats
    const stats = {
      totalInfectedSites: infectedSites.length,
      infectedMasjids: infectedSites.filter((site) => site.isMasjid).length,
      recentActivity: infectedSites.reduce(
        (sum, site) => sum + site.recentActivity,
        0
      ),
      sitesWithWatchers: infectedSites.filter((site) => site.watcherCount > 0)
        .length
    };

    return res.status(200).json({
      stats,
      infectedSites
    } satisfies TGetInfectedSitesResponseData);
  })
);

export default getInfectedSitesHandler;