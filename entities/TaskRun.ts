import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

const statuses = ['requested', 'running', 'complete', 'error', 'stopped'] as const;
type RunStatus = (typeof statuses)[number];

@Entity()
export class TaskRun {
    @PrimaryGeneratedColumn()
    id!: number;

    @Index()
    @Column({
        type: 'character varying',
        length: 50,
    })
    type = '';

    @Column('jsonb', { default: '{}', nullable: false })
    args: {
        [key: string]: unknown;
    } = {};

    @Index()
    @Column({
        type: 'enum',
        enum: statuses,
    })
    status: RunStatus = 'requested';

    @Column('jsonb', { default: [], nullable: false })
    // deno-lint-ignore ban-types
    logs!: {}[];

    @Column('text', { nullable: true })
    error?: string;

    @Column('timestamptz')
    start!: Date;

    @Column('timestamptz', { nullable: true })
    end?: Date;

    @UpdateDateColumn({
        type: 'timestamptz',
    })
    updated!: Date;

    @CreateDateColumn({
        type: 'timestamptz',
    })
    created!: Date;
}
