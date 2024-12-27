export class UniqueIdGenerator {
    private static readonly RANDOM_MASK: number = 0xffff; // Use 16 bits for randomness
    private lastId: number = 0;

    nextId(): number {
        const timestamp = Date.now(); // Current time in milliseconds
        if (timestamp <= this.lastId) {
            this.lastId++;
            this.lastId = this.lastId & UniqueIdGenerator.RANDOM_MASK;
            return this.lastId;
        } else {
            this.lastId = timestamp & UniqueIdGenerator.RANDOM_MASK;
            return timestamp;
        }
    }
}

// Example usage
// const generator = new UniqueIdGenerator();
// console.log(generator.nextId()); // Unique integer ID with randomness
