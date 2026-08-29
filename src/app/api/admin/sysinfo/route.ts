import { NextResponse } from 'next/server'
import os from 'os'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cpus = os.cpus()
    const loadAvg = os.loadavg()
    
    // CPU Load average is based on 1 minute average (loadAvg[0])
    // We normalize it by the number of CPU cores
    const coreCount = cpus.length
    let cpuUsagePercent = (loadAvg[0] / coreCount) * 100
    
    // Cap it at 100% just in case
    if (cpuUsagePercent > 100) cpuUsagePercent = 100
    if (cpuUsagePercent < 1) cpuUsagePercent = Math.ceil(cpuUsagePercent) || 1
    
    // System Memory
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const memUsagePercent = (usedMem / totalMem) * 100
    
    // Uptime
    const uptime = os.uptime()
    
    return NextResponse.json({
      cpu: {
        cores: coreCount,
        loadAverage: Math.round(cpuUsagePercent),
      },
      memory: {
        total: totalMem,
        used: usedMem,
        percent: Math.round(memUsagePercent),
      },
      uptime,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch system info' }, { status: 500 })
  }
}
