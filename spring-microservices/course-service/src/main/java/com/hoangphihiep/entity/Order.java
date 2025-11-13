package com.hoangphihiep.entity;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Date;
import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
@Table(name="orders")
@NamedQuery(name="Order.findAll", query="SELECT o from Order o")
public class Order implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "order_id", unique = true, nullable = false)
    private String orderId;

    @Column(name = "order_date")
    private Date orderDate;

    @Column(precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal amount = BigDecimal.ZERO;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL)
    @Builder.Default
    private Set<OrderItem> orderItems = new HashSet<>();

    @Column(name = "order_status")
    private String orderStatus;

    @Column(name = "user_id")
    private String idUser;

    public int calculateTotal() {
        return 0;
    }

    public void calculateAmount() {
        this.amount = orderItems.stream()
                .map(item -> BigDecimal.valueOf(item.getFinishedFee()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

}
