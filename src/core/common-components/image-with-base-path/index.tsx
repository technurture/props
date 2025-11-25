"use client";
import { image_path } from "@/environment";
/* eslint-disable @next/next/no-img-element */
import React from "react";


interface Image {
  className?: string;
  src: string;
  alt?: string;
  height?: number;
  width?: number;
  id?:string;
}

const isSafeUrl = (url: string): boolean => {
  if (!url) return false;
  const lower = url.toLowerCase().trim();
  
  // Allow http(s) and blob
  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('blob:')) {
    return true;
  }
  
  // For data URLs, only allow safe image MIME types
  if (lower.startsWith('data:')) {
    const mimeMatch = lower.match(/^data:([^;,]+)/);
    if (!mimeMatch) return false;
    
    const mimeType = mimeMatch[1];
    const safeMimeTypes = [
      'image/png',
      'image/jpeg', 
      'image/jpg',
      'image/gif',
      'image/webp'
    ];
    
    return safeMimeTypes.includes(mimeType);
  }
  
  // Allow relative paths (no protocol present)
  // Block any URL with ":" that isn't in the allowed protocols above
  if (!lower.includes(':')) {
    return true; // Relative path without protocol
  }
  
  return false; // Any other protocol is blocked
};

const ImageWithBasePath = (props: Image) => {
  if (!isSafeUrl(props.src)) {
    console.warn('Unsafe URL blocked in ImageWithBasePath:', props.src);
    return (
      <img
        className={props.className}
        src={`${image_path}assets/img/avatars/avatar-01.jpg`}
        height={props.height}
        alt={props.alt || "Image"}
        width={props.width}
        id={props.id}
      />
    );
  }
  
  const isBase64OrUrl = props.src.startsWith('data:') || 
                        props.src.startsWith('http://') || 
                        props.src.startsWith('https://') ||
                        props.src.startsWith('blob:');
  
  const fullSrc = isBase64OrUrl ? props.src : `${image_path}${props.src}`;
  
  return (
    <img
      className={props.className}
      src={fullSrc}
      height={props.height}
      alt={props.alt}
      width={props.width}
      id={props.id}
    />
  );
};

export default React.memo(ImageWithBasePath);
