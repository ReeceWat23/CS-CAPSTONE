/**
 * Jest tests for yocto-queue (node_modules/yocto-queue)
 * Run with: npm run test:jest -- yocto-queue.test.js
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import Queue from 'yocto-queue';

describe('yocto-queue Queue', () => {
  let queue;

  beforeEach(() => {
    queue = new Queue();
  });

  describe('constructor and clear', () => {
    it('starts empty', () => {
      expect(queue.size).toBe(0);
      expect(queue.dequeue()).toBeUndefined();
      expect(queue.peek()).toBeUndefined();
    });

    it('clear resets the queue', () => {
      queue.enqueue(1);
      queue.enqueue(2);
      queue.clear();
      expect(queue.size).toBe(0);
      expect(queue.dequeue()).toBeUndefined();
    });
  });

  describe('enqueue / dequeue', () => {
    it('enqueues and dequeues one value', () => {
      queue.enqueue(42);
      expect(queue.size).toBe(1);
      expect(queue.dequeue()).toBe(42);
      expect(queue.size).toBe(0);
    });

    it('maintains FIFO order', () => {
      queue.enqueue('a');
      queue.enqueue('b');
      queue.enqueue('c');
      expect(queue.dequeue()).toBe('a');
      expect(queue.dequeue()).toBe('b');
      expect(queue.dequeue()).toBe('c');
      expect(queue.dequeue()).toBeUndefined();
    });

    it('dequeue on empty returns undefined', () => {
      expect(queue.dequeue()).toBeUndefined();
      expect(queue.size).toBe(0);
    });
  });

  describe('peek', () => {
    it('returns head without removing', () => {
      queue.enqueue(1);
      queue.enqueue(2);
      expect(queue.peek()).toBe(1);
      expect(queue.size).toBe(2);
      expect(queue.dequeue()).toBe(1);
      expect(queue.peek()).toBe(2);
    });

    it('peek on empty returns undefined', () => {
      expect(queue.peek()).toBeUndefined();
    });
  });

  describe('size', () => {
    it('reflects enqueue and dequeue', () => {
      expect(queue.size).toBe(0);
      queue.enqueue(1);
      expect(queue.size).toBe(1);
      queue.enqueue(2);
      expect(queue.size).toBe(2);
      queue.dequeue();
      expect(queue.size).toBe(1);
      queue.dequeue();
      expect(queue.size).toBe(0);
    });
  });

  describe('Symbol.iterator', () => {
    it('iterates in FIFO order', () => {
      queue.enqueue(1);
      queue.enqueue(2);
      queue.enqueue(3);
      expect([...queue]).toEqual([1, 2, 3]);
      expect(queue.size).toBe(3);
    });

    it('empty queue iterates to empty array', () => {
      expect([...queue]).toEqual([]);
    });
  });

  describe('drain', () => {
    it('yields and removes all items in order', () => {
      queue.enqueue('x');
      queue.enqueue('y');
      queue.enqueue('z');
      expect([...queue.drain()]).toEqual(['x', 'y', 'z']);
      expect(queue.size).toBe(0);
      expect(queue.peek()).toBeUndefined();
    });

    it('drain on empty yields nothing', () => {
      expect([...queue.drain()]).toEqual([]);
    });
  });
});
