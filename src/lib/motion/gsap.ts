import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// Single registration point so every module shares one ScrollTrigger instance.
gsap.registerPlugin(ScrollTrigger)

export { gsap, ScrollTrigger }
