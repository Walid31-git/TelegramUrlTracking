// 'use client'

// import { useEffect, useState } from 'react'
// import { createClient } from '@/lib/supabase/client'
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// import { Badge } from '@/components/ui/badge'
// import { Button } from '@/components/ui/button'
// import { ExternalLink } from 'lucide-react'
// import Link from 'next/link'

// interface PromoterWithStats {
//   id: string
//   name: string
//   total_clicks: number
//   total_conversions: number
//   conversion_rate: number
// }

// export function PromoterTable() {
//   const [promoters, setPromoters] = useState<PromoterWithStats[]>([])
//   const [loading, setLoading] = useState(true)
//   const supabase = createClient()

//   useEffect(() => {
//     async function fetchPromoters() {
//       try {
//         const { data: promotersData } = await supabase
//           .from('promoters')
//           .select(`
//             id,
//             name,
//             promoter_links (
//               id,
//               channel_type,
//               is_used
//             )
//           `)
//           .order('created_at', { ascending: false })
//           .limit(5)

//         if (promotersData) {
//           const promotersWithStats = promotersData.map((promoter: any) => {
//             const publicClicks = promoter.promoter_links
//               .filter((link: any) => link.channel_type === 'public' && link.is_used)
//               .length
            
//             const privateClicks = promoter.promoter_links
//               .filter((link: any) => link.channel_type === 'private' && link.is_used)
//               .length
            
//             // Taux de conversion = (Total Clics privé / Total Clics public) * 100
//             const conversionRate = publicClicks > 0 ? (privateClicks / publicClicks) * 100 : 0

//             return {
//               id: promoter.id,
//               name: promoter.name,
//               total_clicks: publicClicks, // Total Clics public
//               total_conversions: privateClicks, // Total Clics privé
//               conversion_rate: conversionRate,
//             }
//           })

//           setPromoters(promotersWithStats)
//         }
//       } catch (error) {
//         console.error('[v0] Error fetching promoters:', error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchPromoters()
//   }, [supabase])

//   return (
//     <Card>
//       <CardHeader>
//         <CardTitle>Top promoteurs</CardTitle>
//         <CardDescription>Les 5 promoteurs les plus actifs</CardDescription>
//       </CardHeader>
//       <CardContent>
//         {loading ? (
//           <div className="space-y-4">
//             {[...Array(3)].map((_, i) => (
//               <div key={i} className="h-16 animate-pulse rounded bg-muted" />
//             ))}
//           </div>
//         ) : promoters.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-8 text-center">
//             <p className="text-muted-foreground">Aucun promoteur trouvé</p>
//             <Button asChild className="mt-4 bg-success text-success-foreground hover:bg-success/90">
//               <Link href="/dashboard/promoters">Ajouter un promoteur</Link>
//             </Button>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {promoters.map((promoter) => (
//               <div
//                 key={promoter.id}
//                 className="flex items-center justify-between rounded-lg border p-4"
//               >
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2">
//                     <p className="font-medium">{promoter.name}</p>
//                     <Badge
//                       variant="outline"
//                       className="border-success/50 text-success"
//                     >
//                       {promoter.conversion_rate.toFixed(1)}%
//                     </Badge>
//                   </div>
//                   <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
//                     <span>{promoter.total_clicks} clics public</span>
//                     <span>{promoter.total_conversions} clics privé</span>
//                   </div>
//                 </div>
//                 <Button
//                   variant="ghost"
//                   size="icon"
//                   asChild
//                 >
//                   <Link href={`/dashboard/promoters/${promoter.id}`}>
//                     <ExternalLink className="h-4 w-4" />
//                   </Link>
//                 </Button>
//               </div>
//             ))}
//           </div>
//         )}
//       </CardContent>
//     </Card>
//   )
// }
