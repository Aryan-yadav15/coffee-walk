import {
  siAdobeillustrator, siAmazonwebservices, siBlender, siCelery, siClerk, siDocker, siDrizzle, siExpo, siFastapi,
  siFfmpeg, siFigma, siFirebase, siFramer, siGithub, siGithubactions, siGooglechrome, siGooglegemini, siHuggingface,
  siInstagram, siJetpackcompose, siKotlin, siLangchain, siLeaflet, siLinkedin, siMongodb, siNextdotjs, siNodedotjs,
  siOpencv, siPostgresql, siPrisma, siPydantic, siPython, siRazorpay, siReact, siReactquery, siRedis, siRedux,
  siSupabase, siTailwindcss, siThreedotjs, siTypescript, siUipath, siVite, siWebflow, siX,
} from 'simple-icons'

type Icon = { title: string; hex: string; path: string }

// Tool names as they're written in projects.ts, mapped to their brand logo.
const LOGOS: Record<string, Icon> = {
  'react': siReact, 'react native': siReact, 'typescript': siTypescript, 'next.js': siNextdotjs,
  'tailwind': siTailwindcss, 'python': siPython, 'fastapi': siFastapi, 'node.js': siNodedotjs, 'express': siNodedotjs,
  'postgresql': siPostgresql, 'neon postgres': siPostgresql, 'supabase': siSupabase, 'mongodb': siMongodb,
  'mongoose': siMongodb, 'kotlin': siKotlin, 'jetpack compose': siJetpackcompose, 'gemini': siGooglegemini,
  'langchain': siLangchain, 'transformers.js': siHuggingface, 'three.js': siThreedotjs, 'blender': siBlender,
  'figma': siFigma, 'illustrator': siAdobeillustrator, 'razorpay': siRazorpay, 'razorpay webhooks': siRazorpay,
  'aws': siAmazonwebservices, 'docker': siDocker, 'github actions': siGithubactions, 'firebase': siFirebase,
  'drizzle': siDrizzle, 'drizzle orm': siDrizzle, 'expo': siExpo, 'redis': siRedis, 'celery': siCelery,
  'prisma': siPrisma, 'opencv': siOpencv, 'ffmpeg': siFfmpeg, 'leaflet': siLeaflet, 'redux': siRedux,
  'tanstack query': siReactquery, 'uipath': siUipath, 'clerk': siClerk, 'webflow': siWebflow, 'framer': siFramer,
  'pydantic': siPydantic, 'vite': siVite, 'chrome mv3': siGooglechrome,
  'github': siGithub, 'linkedin': siLinkedin, 'x': siX, 'instagram': siInstagram,
}

/** Strips version numbers like "Next.js 14" so the lookup still hits. */
export const logoFor = (name: string) => LOGOS[name.toLowerCase().replace(/\s+v?\d+(\.\d+)*$/, '')]

export function Logo({ name, mono }: { name: string; mono?: boolean }) {
  const icon = logoFor(name)
  if (!icon) return null
  return (
    <svg className="pv-logo" viewBox="0 0 24 24" role="img" aria-label={icon.title} fill={mono ? 'currentColor' : `#${icon.hex}`}>
      <path d={icon.path} />
    </svg>
  )
}
