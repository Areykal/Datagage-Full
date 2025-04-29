<template>
  <transition
    name="page"
    mode="out-in"
    @before-enter="beforeEnter"
    @enter="enter"
    @leave="leave"
  >
    <slot></slot>
  </transition>
</template>

<script setup>
import gsap from "gsap";

const beforeEnter = (el) => {
  el.style.opacity = 0;
  el.style.transform = "translateY(20px)";
};

const enter = (el, done) => {
  gsap.to(el, {
    duration: 0.4,
    opacity: 1,
    y: 0,
    ease: "power2.out",
    onComplete: done,
  });
};

const leave = (el, done) => {
  gsap.to(el, {
    duration: 0.3,
    opacity: 0,
    y: -20,
    ease: "power2.in",
    onComplete: done,
  });
};
</script>
