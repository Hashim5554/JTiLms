// Types for page components and customization

import React, { ReactNode } from 'react';

export type ComponentType = 
  | 'heading' 
  | 'paragraph'
  | 'image'
  | 'card'
  | 'grid'
  | 'divider'
  | 'button'
  | 'list'
  | 'quote'
  | 'video'
  | 'table'
  | 'file';

export interface ComponentTypeInfo {
  id: string;
  name: ComponentType;
  description: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface PageComponent {
  id: string;
  page_id: string;
  component_type_id: string;
  position: number;
  config: ComponentConfig;
  created_at: string;
  updated_at: string;
  component_type?: ComponentTypeInfo;
}

// Base interface for all component configs
export interface BaseComponentConfig {
  className?: string;
  customStyles?: Record<string, string>;
  animation?: 'fade' | 'slide' | 'zoom' | 'none';
}

// Specific component config interfaces
export interface ComponentBase {
  id?: string;
  type: ComponentType;
  order?: number;
  className?: string;
  customStyles?: React.CSSProperties;
  animation?: 'fade' | 'slide' | 'zoom' | 'none';
}

export interface HeadingConfig extends ComponentBase {
  type: 'heading';
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
}

export interface ParagraphConfig extends ComponentBase {
  type: 'paragraph';
  text: string;
}

export interface ImageConfig extends ComponentBase {
  type: 'image';
  src: string;
  alt?: string;
  width?: string | number;
  height?: string | number;
}

export type AnimationType = 'fade' | 'slide' | 'zoom' | 'none';

export interface CardConfig extends ComponentBase {
  type: 'card';
  title?: string;
  content: string | ReactNode;
  image?: ImageConfig;
}

export interface GridConfig extends BaseComponentConfig {
  columns: number;
  gap: string;
  items: GridItem[];
}

export interface GridItem {
  id: string;
  content: string;
  span: number;
  className?: string;
}

export interface DividerConfig extends BaseComponentConfig {
  variant: 'solid' | 'dashed' | 'dotted';
  thickness: number;
  color?: string;
}

export interface ButtonConfig extends ComponentBase {
  type: 'button';
  text: string;
  onClick?: () => void;
  buttonType?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
}

export interface ListItem {
  id: string | number;
  content: React.ReactNode;
}

export interface ListConfig extends ComponentBase {
  type: 'list';
  items: string[];
  ordered?: boolean;
}

export interface QuoteConfig extends BaseComponentConfig {
  text: string;
  citation?: string;
  variant: 'default' | 'bordered' | 'highlighted';
}

export interface VideoConfig extends BaseComponentConfig {
  url: string;
  caption?: string;
  autoplay: boolean;
  controls: boolean;
  width?: string;
  height?: string;
}

export interface TableConfig extends BaseComponentConfig {
  headers: string[];
  rows: string[][];
  striped: boolean;
  bordered: boolean;
}

export interface FileConfig extends BaseComponentConfig {
  url: string;
  name: string;
  size?: string;
  type?: string;
  icon?: string;
}

export interface TextBlockConfig {
  text: string;
  variant: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'blockquote';
  className?: string;
  customStyles?: React.CSSProperties;
  animation?: 'fade' | 'slide' | 'none';
}

// Union type for all component configs
export type ComponentConfig =
  | HeadingConfig
  | ParagraphConfig
  | ImageConfig
  | CardConfig
  | GridConfig
  | DividerConfig
  | ButtonConfig
  | ListConfig
  | QuoteConfig
  | VideoConfig
  | TableConfig
  | FileConfig
  | TextBlockConfig;

// Custom page with layout config
export interface CustomPage {
  id: string;
  title: string;
  path: string;
  class_id: string | null;
  created_at: string;
  updated_at: string;
  config: {
    layout: 'standard' | 'wide' | 'full' | 'sidebar' | 'two-column';
    theme: string;
    bgColor?: string;
    textColor?: string;
    headerImage?: string;
  };
  components?: PageComponent[];
}

export type PageComponentConfig = 
  | { type: 'card', config: CardConfig }
  | { type: 'list', config: ListConfig }
  | { type: 'text', config: TextBlockConfig }
  | { type: 'image', config: ImageConfig }; 